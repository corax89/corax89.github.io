# Intel GMA 3600 / 3650 (Cedar Trail, PowerVR SGX545)

## Полный технический отчёт по драйверу Windows 7: видеоускорение, доступ к регистрам и всё, что нужно для написания собственного драйвера под самописную ОС

---

## Содержание

1. [Резюме](#1-резюме)
2. [Источники: какие драйверы получены и проанализированы](#2-источники)
3. [Состав Windows-драйвера (Windows 7)](#3-состав-windows-драйвера-windows-7)
4. [Архитектура устройства](#4-архитектура-устройства)
5. [PCI-конфигурация и ресурсы](#5-pci-конфигурация-и-ресурсы)
6. [Карта MMIO (BAR0)](#6-карта-mmio-bar0)
7. [Дисплейный конвейер и регистры отображения](#7-дисплейный-конвейер)
8. [GTT, GATT и управление памятью](#8-gtt-gatt-и-память)
9. [Прерывания](#9-прерывания)
10. [Видеоускорение: MSVDX/Topaz и DXVA](#10-видеоускорение)
11. [3D-ускорение: SGX545 и PowerVR Services](#11-3d-ускорение-sgx545)
12. [OpRegion (ACPI/ASLE) и VBT](#12-opregion-acpiasle-и-vbt)
13. [Драйвер для Windows XP (IEGD/EMGD 1.15)](#13-драйвер-windows-xp-iegdemgd)
14. [Практический план драйвера для самописной ОС](#14-план-драйвера-для-самописной-ос)
15. [Приложение А: полный список регистров дисплея](#приложение-а)
16. [Приложение Б: файлы пакетов](#приложение-б)
17. [Приложение В: ссылки](#приложение-в)

---

## 1. Резюме

**Устройство.** Intel GMA 3600/3650 — интегрированная графика платформы Intel Atom Cedar Trail
(процессоры Atom D2500/D2550/D2700 и N2100/N2600/N2800). Вопреки «интелловскому» названию,
GPU — это не архитектура Intel Gen, а лицензированное ядро **Imagination PowerVR SGX545**
(внутреннее кодовое имя «Thalia» — так оно фигурирует в исходниках драйвера: `POULSBO_THALIA_MASK`
совпадает с битом прерывания SGX `_PSB_IRQ_SGX_FLAG`). Кроме 3D-ядра в состав GPU входят:

- **SGX545** — 3D/2D ядро (тайлы, TA/3D + отдельный 2D-блиттер), 400 МГц, ревизия ядра 1.1.x (`SGX_CORE_REV=10131`);
- **MSVDX** (Multi-Standard Video Decoder) — аппаратный видеодекодер (MPEG-1/2/4, H.264, VC-1/WMV9) со
  собственным микропроцессором MTX, собственной MMU и загружаемой прошивкой;
- **Topaz** — аппаратный видеоэнкодер (в Windows-драйвере не используется, используется в Linux VAAPI blob);
- **Дисплейный контроллер** на 3 пайпа (A/B/C) с классической раскладкой регистров в стиле Intel i9xx
  (HTOTAL/DPLL/PIPECONF/DSPACNTR…), DPLL программируются не напрямую, а через **DPIO sideband**;
- **GTT/GATT** — та же схема трансляции «графических адресов», что у i9xx: GTT лежит в украденной
  (stolen) памяти, апертура GATT — 256 МБ.

**Что было проанализировано.** Найден и получен подлинный официальный пакет драйвера
`Win7_1096.exe` (Intel GMA 3600 Series for Windows 7 32-bit, драйвер 8.0.4.1.1096; SHA1 совпадает
с официальным). Дополнительно получены: CAB-версия из Windows Update (8.14.8.1065),
64-битная бета 8.15.8.1050, XP-драйвер (IEGD/EMGD 1.15) и — самое ценное — **официальный
Linux-выпуск «cdv-gfx-drivers 1.0.3_bee»**, содержащий полные GPL-исходники ядерной части
того же самого стека (драйвер `drivers/staging/cdv`: psb_drv, GTT, IRQ, modesetting, MSVDX,
PVR Services 4, hwdefs SGX545). Windows-драйвер закрыт, но построен на **том же** PowerVR
Services DDK 1.7 (build 862890) — совпадают имена моста `PVRSRV_BRIDGE_*`, строки отладки,
архитектура. Поэтому Linux-исходники являются «розеттой-камнем» к закрытому Windows-драйверу,
а заодно и готовым справочником регистров.

**Главные выводы для самописной ОС.**

| Уровень | Задача | Сложность | Комментарий |
|---|---|---|---|
| 1 | Консоль через VGA legacy + LFB через GTT/GATT | Низкая | Нужны только PGETBL_CTL, GTT-записи, DSPACNTR/DSPABASE. BIOS уже настраивает панель |
| 2 | Полный modesetting (DPLL через DPIO, EDID по GMBUS, hot-plug, подсветка) | Средняя | Все последовательности есть в открытых исходниках, здесь они приведены |
| 3 | Vblank/прерывания, MSI | Средняя | Регистры 0x20A0–0x20AC, биты задокументированы |
| 4 | Видеодекодирование (MSVDX) | Высокая, но реализуемая | Прошивка `msvdx_fw.bin` есть в свободном доступе, протокол загрузки и команды — в GPL-исходниках |
| 5 | 3D (SGX545) | Очень высокая | Требует проприетарного микроядра SGX и полного стека PowerVR Services; практичный путь — перенос GPL-ядра PVR 1.7 + пользовательская часть из blob'ов |

---

## 2. Источники

| # | Пакет | Версия | Откуда | Контроль |
|---|---|---|---|---|
| 1 | `Win7_1096_official.exe` (InstallShield) | Драйвер графики **8.0.4.1.1096**, Display Audio 6.14.0.3081, 2013-11-22 | archive.org (зеркало снятого с Intel CDN `downloadmirror.intel.com/23473/a08/Win7_1096.exe`) | SHA1 `9EB7A8CAE691AF3D321FFB3F4C2259E5DDFB48D6` — совпадает с официальным SHA1 со страницы Intel |
| 2 | `muc_gma3600.cab` | **8.14.8.1065**, 2011-12-30 (98 файлов) | Microsoft Update Catalog (запись «Graphics Media Accelerator 3600 Series») | подписан `kit41165.cat` |
| 3 | `Win7_x64_beta.exe` (RAR SFX) | **8.15.8.1050 beta5** x64, 2011-08-30 | archive.org (`intel-gma-drivers-win`) | unofficial-бета, единственный 64-битный вариант |
| 4 | `GMA3600_WinXP.zip` | IEGD/EMGD **1.15** (ветка `EMGD_1_15_CDV_89`), XPDM | archive.org | файлы `iegdmini.sys`, `iegddis.dll`, `igd3dcdv.dll` |
| 5 | `cdv-gfx-drivers-1.0.3_bee.tar.bz2` | PVR DDK **1.7.17.862890**, 2012-08-20 | archive.org (официальный релиз Intel/IMG для Linux) | содержит **полные исходники ядерного драйвера** (патч 3.5 МБ → 224 файла) и прошивки `msvdx_fw.bin`, `topaz_fw.bin` |

Методика: бинарники Windows-драйвера проанализированы извлечением строк (PE32/PE32+), разбором
INF и сравнением с GPL-исходниками Linux-версии того же DDK. Все смещения регистров ниже
взяты из исходников (файлы `psb_intel_reg.h`, `psb_reg.h`, `sysconfig.h`, `psb_msvdx.h`,
`sgx545defs.h`) и подтверждены строками в Windows-бинарниках.

---

## 3. Состав Windows-драйвера (Windows 7)

### 3.1 Двухуровневая архитектура (WDDM)

INF устанавливает **два** ядровых сервиса (оба в группе `Video`, `SERVICE_DEMAND_START`):

```
[iCNT0.Services]
AddService = igdkmd32, 0x00000002, generic_Service_Inst32   ; WDDM KMD
AddService = igddim32, ,             dim_Service_Inst32      ; Display Interface Module
```

| Модуль | Размер (1096) | Роль (по строкам и составу) |
|---|---|---|
| `igdkmd32.sys` (x86) / `imgkmd64.sys` (x64) | 435 КБ / 479 КБ | WDDM-мини-порт. Внутри — **полное ядро PowerVR Services 4** (PVRSRV), инициализация SGX545 и MSVDX, все мосты `PVRSRV_BRIDGE_SGX_*` и `PVRSRV_BRIDGE_MSVDX_*`, работа с микроядром SGX (`SGX Microkernel assert fail`, `SGX Host control`, `SGX Kernel CCB WO/RO`) |
| `igddim32.sys` / `igddim64.sys` | 1,35 МБ / 1,70 МБ | «Display Interface Module» — дисплейная половина: пайпы/плоскости/курсоры, EDID/DDC/GMBUS, VBT, OpRegion, COPP/OPM/HDCP/PAVP (в строках: `Pipe`, `Plane`, `Cursor`, `Edid`, `Ddc`, `GMBus`, `OpRegion`, `VBT`, `DPLL`, `HDCP`, `PAVP`, `DVMT`) |

Пользовательский режим (WDDM):

| Файл | Роль |
|---|---|
| `igdumd32.dll` | UMD Direct3D (WDDM). Внутри — компилятор шейдеров USC2 (пути `X:\eurasia\tools\intern\usc2\*.c`) и, по-видимому, образ микроядра SGX |
| `igdogl32.dll` / `imgogl32.dll` | OpenGL ICD |
| `igddxva32.dll` | **DXVA** (видеоускорение) — классы `CMpeg2VldDecoder`, `CH264VldDecoder`, `CVC1VldDecoder` и MC-варианты; разговаривает с KMD через мост `PVRSRV_BRIDGE_MSVDX_*` |
| `igdvidproc32.dll` | видео-постобработка |
| `igdaux32.dll` | вспомогательный |
| `GfxUI.exe`, `igfxcpl.cpl`, `igfxtray.exe`, `hkcmd.exe`, `igfxpers.exe`, `igfxsrvc.*`, `gfxSrvc.dll`, `GfxCUIService`, `IgfxExt.exe`, `igfxdev.dll`, `igfxdo.dll`, `igfxexps.dll`, `igfxpph.dll`, `hccutils.dll`, `igfxTMM.dll`, `oemdspif.dll` | панель управления, хоткеи, автозапуск, TMM (многомониторные настройки), OEM-интерфейс дисплея |

Защита вывода (COPP/OPM): `coppdev.cpa` (1,66 МБ — кодовый блоб с прологом `pushfd/pusha/call/.../popa/popfd/ret`),
сертификаты `device_key_auth.vp`, `device_key_copp.vp`, `device_key_opm.vp`, `coppdev.vp`, `igddim32.vp`.

Служебные файлы: `GfxCUIServiceInstall.vbs`, `difx32.dll` (DIFx), `igxpco32.dll`/`igxpun.exe` (коинсталлер),
`igdlh.inf`/`igdlh.cat`, `kit41165.cat` (каталог WU-пакета).

### 3.2 Ключевые сведения из INF

```ini
DriverVer=12/30/2011, 8.14.8.1065        ; WU-версия (в 1096: DriverVer 2013)
CatalogFile=igdlh.cat
ClassGUID={4D36E968-E325-11CE-BFC1-08002BE10318}   ; Display

; Поддерживаемые PCI ID (x86 WDDM):
PCI\VEN_8086&DEV_0BE0   ; Atom N2600/D2500 (GMA 3600)
PCI\VEN_8086&DEV_0BE1
PCI\VEN_8086&DEV_0BE2
PCI\VEN_8086&DEV_0BE3   ; (XP-IEGD добавляет 0BE4, 0BE5, 0BE6; всё семейство 0BE0..0BF1)

HKR,, InstalledDisplayDrivers, %REG_MULTI_SZ%, igdumd32
HKR,, UserModeDriverName,      %REG_MULTI_SZ%, igdumd32.dll
HKR,, OpenGLDriverName,        %REG_MULTI_SZ%, igdogl32.dll
HKR,, VgaCompatible,           %REG_DWORD%, 0

; MSI включён аппаратно-зависимой секцией:
[iCNT0.HW]
HKR, "Interrupt Management\MessageSignaledInterruptProperties", MSISupported, 0x00010001, 1
```

Опции реестра (секция `generic_SoftwareDeviceSettings` и др.) дают представление о
возможностях: `Display1_EnableRotation=1` (аппаратный поворот), `EnableSeamlessRotation`,
`UseMOPTI=1`, секции `SDVOHDMI_VSI`, `HDMICEATimings`, `Underscan`, `HotPlug`, `IntLVDSSwing`,
`BitBashingForHDCP`, `AsyncFlips`, `PipeOptimization` и т. д.

### 3.3 64-битная бета (8.15.8.1050)

Та же схема, но файлы UMD носят имена Imagination: `imghal64.dll` (UMD), `imgogl64.dll`,
`imgdxva64.dll`, `imgvidproc64.dll` + `imgdxva32.dll` (WOW64). KMD: `imgkmd64.sys` + `igddim64.sys`.
Это подтверждает происхождение стека: «img*» — исходные имена PowerVR DDK, «igd*» — ребрендинг Intel.

### 3.4 Сравнение версий

| Свойство | WU CAB 8.14.8.1065 | Официальный 8.0.4.1.1096 |
|---|---|---|
| Дата | 2011-12-30 | 2013-11-04 (файлы) / 2013-11-22 (readme) |
| `igdkmd32.sys` | 418 816 Б | 435 200 Б |
| `igddim32.sys` | 1 338 368 Б | 1 349 632 Б |
| Исправления | — | «screen tearing в Google Earth» (последний релиз) |

Обе версии совместимы по архитектуре; для анализа использовались обе (в 1096 свежее CUI).

---
## 4. Архитектура устройства

```
                     Atom D2xxx/N2xxx (Cedar Trail, 32 нм)
 ┌─────────────────────────────────────────────────────────────────────────┐
 │  CPU core ×2   ─ L2 ─  системный агент (хост-бридж 0:0:0: GMCH, BSM)    │
 │                                   │                                     │
 │  GPU-кластер (PCI 0:2:0, VEN 8086 DEV 0BEx):                            │
 │   ┌───────────────┐  ┌──────────────┐  ┌─────────────────────────────┐  │
 │   │ SGX545        │  │ MSVDX        │  │ Дисплей (Thalia-блок)       │  │
 │   │  TA/3D/2D     │  │  MTX (MIPS-  │  │  3 пайпа (A/B/C)            │  │
 │   │  USSE, PDS    │  │  подобный ЦП)│  │  3 plane (DSP A/B/C)        │  │
 │   │  MMU (BIF)    │  │  VEC (энтроп)│  │  3 курсора                  │  │
 │   │  микроядро    │  │  DEB/VDMC/…  │  │  Overlay (2 шт.)            │  │
 │   │  (загружается)│  │  собственная │  │  VGA-совместимость          │  │
 │   │               │  │  MMU         │  │  LVDS / SDVO-HDMI / CRT /   │  │
 │   └──────┬────────┘  └──────┬───────┘  │  DisplayPort ×2 / MIPI-DSI  │  │
 │          │                  │          │  DPIO (PHY/PLL, sideband)   │  │
 │          └─────────┬────────┘          └──────────────┬──────────────┘  │
 │                    └──── GTT/GATT (256 МБ апертура) ─┘                 │
 │                          stolen memory (DVMT 1..256 МБ)                 │
 └─────────────────────────────────────────────────────────────────────────┘
```

Факты об архитектуре, извлечённые из драйвера:

- **SGX545** — тайловое ядро Imagination: этапы TA (Tiling Accelerator) → TSP/ISP (тайловая
  растеризация) → USSE (унифицированные шейдерные движки), плюс отдельный **2D-блиттер**
  (в регистрах ядра есть блоки `2D_CLKG`, `TWOD_RESET`, слейв-порт 2D по смещению +0x4000,
  и мосты `PVRSRV_BRIDGE_SGX_SUBMIT2D`, `REGISTER_HW_2D_CONTEXT`). Частота — 400 МГц
  (`SYS_SGX_CLOCK_SPEED`), фиксируется платформой.
- **MSVDX** — отдельный блок с собственным процессором **MTX** (исполняет прошивку
  `msvdx_fw.bin`), собственной **MMU** (двухуровневая, 4 МБ страницы каталога) и
  буферами реконструкции **RENDEC**. Биты прерываний MSVDX — 1<<19.
- Имя **Thalia** (1<<18) — это и есть SGX: `#define _PSB_IRQ_SGX_FLAG (1<<18)` и
  `#define POULSBO_THALIA_MASK (1<<18)` — один и тот же бит.
- **Дисплей** имеет 3 пайпа; на Cedar Trail используются A (CRT/HDMI/DP) и B (LVDS/SDVO),
  пайп C достался от Medfield (MIPI-DSI блок в регистрах присутствует, но не задействован).
- Тайминги-регистры полностью повторяют Intel i9xx: `HTOTAL_A=0x60000`, `DPLL_A=0x6014`,
  `SDVOB=0x61140`, `LVDS=0x61180`, `PIPEACONF=0x70008`, `DSPACNTR=0x70180` и т. д. —
  это осознанное наследование: один и тот же код display-driver (psb_intel_*) работает.
- Отличие от i9xx: **PLL/DPLL программируются через DPIO sideband** (адреса 0x8008/0x8014/…),
  а не напрямую через FPn0/FPn1; есть горячие «зашитые» значения референса (`0x68A701` и др.).
- Частота «графического ядра» (для таймингов) читается из регистра `0x20C8`:
  биты [7:4]: 0→160, 1→200, 2→267, 3→320, 4→356, 5→400 МГц.

---

## 5. PCI-конфигурация и ресурсы

### 5.1 Идентификация

- Vendor `8086`, Device `0BE0`–`0BE3` (INF WDDM), до `0BE6` (IEGD); всё семейство по маске
  `(dev & 0xfff0) == 0x0BE0` (макрос `IS_CDV`). Class 03h (VGA).
- Функция одна: графика+дисплей+видео в одном PCI-устройстве (в отличие от Poulsbo, где
  SGX был отдельной функцией 0:2:1). Отдельного PCI-устройства MSVDX нет — блок живёт
  за MMIO-окном основного устройства (в коде, тем не менее, остались переменные
  `gui32MRSTMSVDXDeviceID`/`gui32MRSTTOPAZDeviceID` от Medfield).
- Stepping: revision host-бриджа (0:0:0) < 4 → нужен «sample cache workaround»
  (`need_sample_cache_workaround`). Revision GPU: `MSVDX_CORE_REV` и `EUR_CR_CORE_REVISION`.

### 5.2 BAR'ы

| BAR | Содержимое | Размер |
|---|---|---|
| BAR0 (MMADR) | Все MMIO-регистры: core-регистры, прерывания, DPIO, GPIO/GMBUS, дисплей 0x60000/0x70000, SGX 0x80000, MSVDX 0x90000 | 0xC0000 (786 КБ) |
| BAR2 (GMADR/GATT) | Апертура GATT — линейное окно на GTT-отображённую память. Драйвер использует фиксированную базу **0x40000000**, размер **256 МБ** | 256 МБ |
| BAR3 (GTTADR) | (в коде значится как `PSB_GTT_RESOURCE`) — реальный GTT лежит в stolen-памяти; база берётся из `PGETBL_CTL` | 256 КБ (64 страницы PTE = 256 МБ апертуры) |

> Примечание: в коде `psb_gtt.c` база GATT жёстко задана как 0x40000000, а размер GTT
> фиксирован: `gtt_pages = 256/4 = 64` страницы по 4 КБ → 256 КБ GTT → 65536 записей →
> апертура 256 МБ.

### 5.3 Конфигурационные регистры (не BAR)

| Где | Смещение | Имя | Смысл |
|---|---|---|---|
| Хост-бридж 0:0:0 | 0x52 | `PSB_GMCH_CTRL` | бит 2 = включение графического декодера (`_PSB_GMCH_ENABLED`); биты [6:4] = **DVMT-режим** (1→1 МБ, иначе 2<<(n−1) МБ stolen) |
| Хост-бридж 0:0:0 | 0x5C | `PSB_BSM` | база украденной памяти (stolen base), dword, выравнивание по странице |
| Графика 0:2:0 | 0x2020 | `PSB_PGETBL_CTL` | бит 0 = включить GTT (`_PSB_PGETBL_ENABLED`); биты [31:12] = **физический адрес таблицы GTT** (BIOS размещает GTT сразу за stolen: `stolen_size = gtt_base − stolen_base − 4КБ`) |
| Графика 0:2:0 | 0x94 / 0x98 | MSI addr/data | MSI настраивается кодом (`pci_enable_msi`) и/или INF; драйвер напрямую знает про `PCIx_MSI_ADDR_LOC 0x94`, `DATA_LOC 0x98` |
| Графика 0:2:0 | 0xE4 | `PCI_ASLE` | ASLE (interrupt/status OpRegion) |
| Графика 0:2:0 | 0xFC | `PCI_ASLS` | физический адрес **OpRegion** (см. раздел 12) |
| MMIO 0x20C8 | — | `INTEL_CDV_DISP_CLK_FREQ` | частоты: биты [7:4] → 160/200/267/320/356/400 МГц |

### 5.4 Карта памяти (RAM)

```
 stolen_base (BSM 0x5C)  ─►  украденная память (DVMT 1/8/…/256 МБ): framebuffer'ы, GTT
 gtt_base (PGETBL_CTL)   ─►  таблица GTT (256 КБ), сразу после stolen-областей
 CI-область              ─►  дополнительная stolen-область для видеоблока
                             («CI is not included in the stolen size since the TOPAZ MMU bug»)
 RAR-область             ─►  Restricted Access Region (использовалась для защищённого видео)
```

Обе области (CI, RAR) драйвер отображает в **видео-MMU** по виртуальному адресу
`0xE0000000 + ci_start` (см. раздел 8.4).

---

## 6. Карта MMIO (BAR0)

Все смещения — от начала BAR0. Полный список именованных регистров — в Приложении А.

| Смещение | Размер | Блок | Что внутри |
|---|---|---|---|
| 0x00000–0x02100 | 8,25 КБ | Core/system registers | прерывания 0x20A0–0x20AC, DPIO sideband 0x2100–0x2110, `FW_BLC_SELF 0x20E0`, `PERF_MODE 0x20F4`, `PSB_MSVDX_CLOCKGATING 0x2064`, `PSB_INSTPM 0x20C0`, `DSPCLK_GATE_D 0x6200`?? (см. прим.) |
| 0x02100–0x02110 | 16 Б | **DPIO sideband** | `SB_PCKT 0x2100`, `SB_DATA 0x2104`, `SB_ADDR 0x2108`, `DPIO_CFG 0x2110` |
| 0x03000 | 8 КБ | Overlay pipeline A | `OV_OVADD 0x30000`, `OV_DOVASTA 0x30008`, гамма `OV_OGAMC0..5 0x30010..0x30024` |
| 0x03800 | 8 КБ | Overlay pipeline C | `OVC_OVADD 0x38000`, … |
| 0x05010–0x0502C | — | GPIO-пары (I2C bit-bang) | `GPIOA..GPIOH` |
| 0x05100–0x05120 | — | **GMBUS** (аппаратный I2C) | `GMBUS0..GMBUS5` |
| 0x06014/18/1C/20 | — | DPLL A/B + DPLL_MD | см. раздел 7.2 |
| 0x06040–0x0604C | — | `FPA0/FPA1/FPB0/FPB1` | на CDV фактически не используются (PLL в DPIO), оставлены от i9xx |
| 0x0606C | — | `DPLL_TEST` | |
| 0x0A000/0A800/0AC00 | 3×2 КБ | Палитры A/B/C | 256×32 бит |
| 0x120/0x220/0x2320/0x2420 | — | **DPIO LANES** (в DPIO-адресном пространстве!) | `PSB_LANE0..LANE3` — программируются sideband-записями |
| 0x20000–0x2100 | — | (та же первая страница, см. 0x20xx) | |
| 0x30000 | — | Display block «0x60000-страница»: тайминги/коннекторы | `HTOTAL_A 0x60000` … `VSYNCSHIFT_B 0x61028`, `DPLL_A 0x6014`, `ADPA 0x61100`, `SDVOB 0x61140`, `HDMIPHYMISCCTL 0x61134`, `LVDS 0x61180`, `PP_* 0x61200`, `BLC_* 0x61250`, `PFIT_* 0x61230`, `PORT_HOTPLUG_EN 0x61110`, `DP_B 0x64100`, `DP_C 0x64200`, `DSPCLK_GATE_D 0x6200`* |
| 0x70000 + 0x2000 | 8 КБ | **Пайпы/плоскости/курсоры** | `PIPEACONF 0x70008`, `PIPEASTAT 0x70024`, `DSPARB 0x70030`, `DSPFW1..6`, `CURACNTR 0x70080`, `DSPACNTR 0x70180`, `DSPABASE 0x70184`, `DSPASURF 0x7019C`, пайп B — 0x71xxx, пайп C — 0x72xxx, `VGACNTRL 0x71400`, `SWF0..6 0x71410`, `DSPCHICKENBIT 0x70400` |
| 0x80000 + 0x4000 | 16 КБ | **SGX545** | см. раздел 11 |
| 0x90000 + 0x10000 | 64 КБ | **MSVDX** | см. раздел 10 |

\* В оригинале `DSPCLK_GATE_D 0x6200` и `RAMCLK_GATE_D 0x6210` наследованы от i9xx-кода;
на CDV активным является блок гейтирования вокруг 0x6200 (в старших страницах дисплея)
и `DPIOUNIT_CLOCK_GATE_DISABLE` в `DPIO_CFG`.

Управление питанием подсистем — через **P-Unit**: порт `PSB_PUNIT_PORT 0x04`, регистры
`PSB_OSPMBA 0x78` / `PSB_APMBA 0x7A`, команды `PSB_APM_CMD`, статусы `PSB_APM_STS`;
маски питания `PSB_PWRGT_VID_DEC_*`, `PSB_PWRGT_GFX_*`, `PSB_PM_SSC 0x20` / `SSS 0x30`
(питание дисплея A/B/C/MIPI: биты 0x0C / 0xC000 / 0x30000 / 0xC0000).

---
## 7. Дисплейный конвейер

### 7.1 Структура: пайп → коннектор, плоскость, курсор

Три пайпа (A=0, B=1, C=2). Адрес регистра вычисляется как `_PIPE(pipe, база_A, база_B)`:

| Группа | Pipe A | Pipe B | Pipe C |
|---|---|---|---|
| Тайминги HTOTAL/HBLANK/HSYNC/VTOTAL/VBLANK/VSYNC | 0x60000..0x60014 (шаг 4) | 0x61000.. | 0x62000.. |
| `PIPESRC` / `BCLRPAT` / `VSYNCSHIFT` | 0x6001C/0x60020/0x60028 | 0x6101C/… | 0x6201C/… |
| `PIPECONF` | 0x70008 | 0x71008 | 0x72008 |
| `PIPESTAT` | 0x70024 | 0x71024 | 0x72024 |
| Plane CNTR/BASE/LINOFF/STRIDE/POS/SIZE/SURF/TILEOFF | 0x70180/0x70184/0x70184/0x70188/0x7018C/0x70190/0x7019C/0x701A4 | 0x71180/… | 0x72180/… |
| Cursor CNTR/BASE/POS | 0x70080/0x70084/0x70088 | 0x700C0/0x700C4/0x700C8 | 0x700E0/0x700E4/0x700E8 |
| Ключ цвета (DSPC plane C) | DSPAKEYVAL 0x70194 / DSPAKEYMASK 0x70198 | — | 0x72194/0x721A0/0x72198 |

Важные биты:

```c
PIPECONF:  PIPEACONF_ENABLE (1<<31), PIPE_GMCH_GAMMA_DISABLE?, PIPE_BPC_MASK (8BPC/10BPC/6BPC),
           PIPE_FIFO_UNDERRUN (устанавливается при недогрузке FIFO — пишется 1 для сброса)
DSPACNTR:  DISPLAY_PLANE_ENABLE (1<<31), DISPPLANE_GAMMA_ENABLE,
           DISPPLANE_SEL_PIPE_A/B, DISPPLANE_PIXFORMAT_MASK:
             DISPPLANE_8BPP, DISPPLANE_15_16BPP, DISPPLANE_16BPP, DISPPLANE_32BPP_NO_ALPHA
DSPABASE:  на CDV — смещение (offset) внутри поверхности; DSPASURF — база поверхности (GTT-адрес).
           Последовательность CDV: WRITE(DSPABASE, offset); WRITE(DSPASURF, base) — двойная запись
           запускает обновление (см. pipe_set_base ниже).
CURACNTR:  CURSOR_MODE_DISABLE=0, CURSOR_MODE_64_32B_AX=0x07 (64×64 ARGB 32bpp)
```

Формат таймингов — классический i9xx: `HTOTAL = ((total−1)<<16) | (active−1)`,
`HSYNC = ((end−1)<<16) | (start−1)`; `DSPASIZE = ((h−1)<<16)|(v−1)`; `PIPESRC` аналогично.

Водные знаки FIFO: `DSPARB 0x70030`, `DSPFW1 0x70034`, `DSPFW2 0x70038`, `DSPFW3 0x7003C`,
`DSPFW4/5/6 0x70070/74/78`, `DSPCHICKENBIT 0x70400` (для underrun-фиксов).

### 7.2 DPLL и DPIO (sideband)

Регистры DPLL у CDV находятся на привычных местах i9xx, но **частотные делители живут
в DPIO** — отдельном PHY-домене, доступном через sideband:

```c
// Порты sideband (BAR0):
SB_PCKT  0x2100  // [31:16] opcode (0=READ, 1=WRITE); [15:8] dest=0x88 (DPLL);
                 // [7:4] byte-enable (0xF); бит0 SB_BUSY
SB_DATA  0x2104  // данные
SB_ADDR  0x2108  // адрес DPIO-регистра
DPIO_CFG 0x2110  // DPIO_CMN_RESET_N(1<<0), DPIO_SFR_BYPASS(1<<1),
                 // DPIO_MODE_SELECT_0/1 (1<<2/1<<3), DPIOUNIT_CLOCK_GATE_DISABLE (1<<6)

int psb_sb_read(dev, reg, *val):
    wait SB_PCKT.busy == 0
    SB_ADDR = reg
    SB_PCKT = (READ<<16)|(0x88<<8)|(0xF<<4)
    wait SB_PCKT.busy == 0
    *val = SB_DATA

int psb_sb_write(dev, reg, val):
    wait busy==0
    SB_ADDR = reg; SB_DATA = val
    SB_PCKT = (WRITE<<16)|(0x88<<8)|(0xF<<4)
    wait busy==0
```

DPIO-адреса (в адресном пространстве DPIO, а не BAR0):

| Адрес | Назначение |
|---|---|
| 0x8008 / 0x8028 | `SB_M` pipe A / B (делитель M — биты [31:24]) |
| 0x8014 / 0x8034 | `SB_N_VCO` pipe A / B ([31:30] VCO_SEL, [29:26] N divider, [25:24] CB_TUNE) |
| 0x8010 / 0x8030 | `SB_REF_SFR` A / B (выбор референса: REF_CLK_DPLL / REF_CLK_DPLLA) |
| 0x0120/0x0220/0x2320/0x2420 | `PSB_LANE0..3` — Lane PLL (биты LANE_PLL_ENABLE, LANE_PLL_PIPE) |
| (pipe) | `SB_P` (P1/P2 делители), `SB_ALT_REF`, `SB_MISC_DFX` |

Последовательность включения PLL (из `psb_intel_dpll_cdv.c` — дословно):

```c
psb_sb_reset(dev);                                   // сброс sideband-машины
WRITE(DPLL_x, DPLL_SYNCLOCK_ENABLE | DPLL_VGA_MODE_DIS);   // 0x6014/0x6018
udelay(100);
psb_sb_write(SB_REF_SFR(pipe), 0x68A701);            // «Follow the BIOS» — захардкожено
ref = READ(SB_REF_SFR(pipe)); ref &= ~REF_CLK_MASK;
ref |= (pipe==1 && !is_lvds && !is_dp) ? REF_CLK_DPLLA : REF_CLK_DPLL;
psb_sb_write(SB_REF_SFR(pipe), ref);
m  = READ(SB_M(pipe));    m  = (m & ~SB_M_DIVIDER_MASK) | (clock.m2 << 24);  WRITE;
nv = READ(SB_N_VCO(pipe));
nv = (nv & 0xFFFF) | 0x107;                          // тоже «по BIOS»
nv &= ~(SB_N_VCO_SEL|SB_N_DIVIDER|SB_N_CB_TUNE);
nv |= clock.n << SB_N_DIVIDER_SHIFT;
// выбор CB_TUNE/VCO_SEL по диапазону VCO:
//   VCO < 2.25ГГц: CB_TUNE=2, VCO_SEL=0
//   VCO < 2.75ГГц: CB_TUNE=1, VCO_SEL=1
//   VCO < 3.30ГГц: CB_TUNE=0, VCO_SEL=2
//   иначе:         CB_TUNE=0, VCO_SEL=3
WRITE(SB_N_VCO, nv);
p = READ(SB_P(pipe)); p |= SET_FIELD(clock.p1, SB_P1); SET_FIELD(clock.p2(5|10), SB_P2); WRITE;
WRITE(SB_ALT_REF(pipe), 0x10100300);
WRITE(SB_MISC_DFX(pipe), 0x1FFB0010);
WRITE(SB_ALT_REF(pipe), 0x10100300);                 // да, повторно — как в драйвере
// при наличии DDI (HDMI/DP):
lane = READ(PSB_LANE0); lane = (lane & ~LANE_PLL_MASK) | LANE_PLL_ENABLE | LANE_PLL_PIPE(pipe);
WRITE(PSB_LANE0, lane);  // и LANE1 (DDI0) либо LANE2+LANE3 (DDI1)
udelay(150);
// затем включение VCO:
WRITE(DPLL_x, (READ(DPLL_x) & ~DPLL_LOCK) | DPLL_VCO_ENABLE);
wait_for(READ(DPLL_x) & DPLL_LOCK (1<<15));          // CDV-специфичный бит LOCK
```

Референсные частоты: SKU-зависимо — `refclk = 96000` (low-end) или `27000` (high-end);
для DP/eDP: pipe A → 27 МГц, pipe B → 100 МГц; для LVDS при SSC — частота SSC из VBT
(`lvds_ssc_freq`). Доступные пределы делителей — в таблице `cdv_intel_limit()`:
(ограничения m/n/p в стиле i9xx; VCO до ~3,3 ГГц).

### 7.3 Коннекторы

| Регистры | Смещение | Что программировать |
|---|---|---|
| CRT (VGA DAC) | `ADPA 0x61100` | enable, порты синхры; hot-plug `PORT_HOTPLUG_EN 0x61110`, `PORT_HOTPLUG_STAT 0x61114` |
| HDMI/SDVO B | `SDVOB 0x61140` (= `HDMIB_CONTROL`), PHY: `HDMIPHYMISCCTL 0x61134` | SDVO-протокол Intel (билеты) с TMDS-модулем; VSI/CEA-тайминги из INF |
| HDMI/SDVO C | `SDVOC 0x61160` | аналогично |
| LVDS | `LVDS 0x61180` | `LVDS_PORT_EN`, `LVDS_A0A2_CLKA_POWER_UP`, выбор пайпа (`LVDS_PIPEB_SELECT`), dual-channel (`LVDS_B0B3_POWER_UP|LVDS_CLKB_POWER_UP` при p2==7), 18/24 бита (`LVDS_A3_POWER_*`) |
| DisplayPort B/C | `DP_B 0x64100`, `DP_C 0x64200`, AUX: `DPB_AUX_CH_CTL 0x64110` + `DATA1..5`, `DPC_* 0x642xx` | стандартный DP AUX (i9xx-совместимые биты), Link M/N: `PIPE_GMCH_DATA_M/N`, `PIPE_DP_LINK_M/N` |
| MIPI-DSI | блок 0xB0xx/0xB1xx (`DEVICE_READY_REG 0xB000`, `INTR_STAT/EN 0xB004/08`, `DPI_RESOLUTION_REG 0xB020`, …) | унаследован от Medfield; на десктопных платах не используется |
| Панель (LVDS/eDP) | `PP_STATUS 0x61200`, `PP_CONTROL 0x61204`, `PP_ON_DELAYS 0x61208`, `PP_OFF_DELAYS 0x6120C`, `PP_DIVISOR 0x61210` | силовая последовательность панели; в коде: `PP_CONTROL |= POWER_TARGET_ON; … wait PP_STATUS`: `PP_CONTROL &= ~…` при выключении |
| Подсветка | `BLC_PWM_CTL2 0x61250`, `BLC_PWM_CTL 0x61254` (+ `_C` варианты 0x62250/0x62254) | PWM duty cycle; tie-in с ASLE (`bclp`) |

### 7.4 EDID: GMBUS и bit-banging

I2C-доступ к DDC делается двумя способами (как в i915):

1. **Аппаратный GMBUS** — `GMBUS0 0x5100` (выбор пары/скорость), `GMBUS1 0x5104`
   (команда: адрес, длина, биты SW/старт/стоп), `GMBUS2 0x5108` (статус: HW_RDY, NACK…),
   `GMBUS3 0x510C` (данные FIFO), `GMBUS4 0x5110` (маска прерываний), `GMBUS5 0x5120`
   (индексный режим >4 байт).
2. **GPIO bit-bang** — `GPIOA..GPIOH 0x5010..0x502C` (тактовый/данные пины, направление).
   Драйвер использует bit-banging для HDCP (`BitBashingForHDCP_AddSwSettings`) и как fallback.

Чтение EDID: 128/256 байт с адреса 0xA0; парсинг — `psb_intel_bios.c` (VBT) плюс стандартный
EDID-разбор. Горячее подключение — биты `PORT_HOTPLUG_EN/STAT` + прерывание `DISP_HOTSYNC (1<<17)`.

### 7.5 VGA-совместимость

- `VGACNTRL 0x71400` — включение/выключение VGA-режима (перед первым modesetting нужно
  перевести устройство из VGA-режима: бит VGA disable + подтверждение).
- Legacy I/O-порты: `VGA_SR_INDEX 0x3C4` / `VGA_SR_DATA 0x3C5` (Sequencer) — упомянуты
  прямо в заголовке; полный стандартный набор 0x3B0–0x3DF транслируется в регистры
  дисплея пока VGA-режим включён.
- Палитра: `PALETTE_A 0xA000` (256 записей по 32 бита; грузится функцией
  `psb_intel_crtc_load_lut` при включённых тактах пайпа).

### 7.6 Полная последовательность modesetting (из `cdv_intel_crtc_mode_set`)

```text
1. Выбрать refclk (SKU/DP/LVDS-SSC), посчитать clock (m2, n, p1, p2) по limit-таблице.
2. Если DP/eDP — выставить Link M/N (PIPE_GMCH_DATA_M/N, PIPE_DP_LINK_M/N).
3. WRITE(DPLL_x, DPLL_SYNCLOCK_ENABLE | DPLL_VGA_MODE_DIS); udelay(100);
4. Программирование DPIO (REF/SFR 0x68A701, M, N_VCO+0x107, P, ALT_REF, MISC_DFX, Lanes).
5. udelay(150).
6. Если LVDS — включить LVDS-пины ДО PLL:
      LVDS |= LVDS_PORT_EN | LVDS_A0A2_CLKA_POWER_UP | LVDS_PIPEB_SELECT
      (+ dual channel по p2==7)
7. WRITE(DPLL_x, (READ&~DPLL_LOCK)|DPLL_VCO_ENABLE); ждать DPLL_LOCK (бит 15).
8. Отключить panel fitter, если он на этом пайпе (PFIT_CONTROL 0x61230 = 0).
9. Программирование таймингов:
      HTOTAL/HBLANK/HSYNC/VTOTAL/VBLANK/VSYNC (формат (val-1) в старшем/младшем полуслове)
      DSPxSIZE = ((vdisplay-1)<<16)|(hdisplay-1); DSPxPOS = 0;
      PIPExSRC = ((h-1)<<16)|(v-1)
10. pipeconf: сохранить BPC (8/6/10 бит по eDP/LVDS), WRITE(PIPEACONF, pipeconf) —
    пока БЕЗ бита enable, затем psb_intel_wait_for_vblank().
11. dspcntr = DISPPLANE_GAMMA_ENABLE | DISPPLANE_SEL_PIPE_x | DISPLAY_PLANE_ENABLE;
    WRITE(DSPxCNTR, dspcntr).
12. pipe_set_base: WRITE(DSPxSTRIDE, pitch); WRITE(DSPxCNTR, формат пикселей);
    WRITE(DSPABASE, offset); WRITE(DSPASURF, gtt_base_поверхности); (для CDV — именно так:
    сначала BASE=offset, затем SURF=base, оба с перечитыванием).
13. WRITE(PIPEACONF, pipeconf | PIPEACONF_ENABLE); wait_for_vblank();
    затем загрузить LUT (PALETTE_x) если нужно.
```

Выключение — в обратном порядке: plane off → pipeconf off → LVDS off → PP off → DPLL VCO off.

---
## 8. GTT, GATT и память

### 8.1 Включение GTT

```c
// 1. Разрешить графический декодер в хост-бридже:
gmch = pci_read_config_word(host_bridge_000, 0x52);
pci_write_config_word(host_bridge_000, 0x52, gmch | 0x4);      // _PSB_GMCH_ENABLED

// 2. Включить GTT и узнать его базу (её выставил BIOS):
pge_ctl = REG32(BAR0 + 0x2020);            // PSB_PGETBL_CTL — да, он в MMIO BAR0
REG32(BAR0 + 0x2020) = pge_ctl | 1;        // _PSB_PGETBL_ENABLED
(void)REG32(BAR0 + 0x2020);                // чтение для постинга

gtt_phys = pge_ctl & 0xFFFFF000;           // физический адрес таблицы GTT в RAM
stolen_base = pci_read_config_dword(000, 0x5C);              // PSB_BSM
stolen_size = gtt_phys - stolen_base - 0x1000;               // оценка драйвера
dvmt_mode = (gmch >> 4) & 0x7;             // номинал: 1→1МБ, иначе 2<<(mode-1) МБ
```

### 8.2 Формат записи GTT (PTE)

```c
static inline uint32_t psb_gtt_mask_pte(uint32_t pfn, int type) {
    uint32_t mask = PSB_PTE_VALID;              // 0x0001
    if (type & PSB_MMU_CACHED_MEMORY) mask |= PSB_PTE_CACHED;   // 0x0008
    if (type & PSB_MMU_RO_MEMORY)     mask |= PSB_PTE_RO;       // 0x0004
    if (type & PSB_MMU_WO_MEMORY)     mask |= PSB_PTE_WO;       // 0x0002
    return (pfn << 12) | mask;
}
// запись: GTT[i] = (phys >> 12) << 12 | flags;  i — номер страницы апертуры
// после серии записей драйвер делает контрольное чтение последней записи (постинг).
```

Итого PTE = `pfn<<12 | VALID(1) | WO(2) | RO(4) | CACHED(8)`.

### 8.3 GATT-апертура

- Апертура — BAR2, драйвер использует базу **0x40000000** и размер **256 МБ**
  (`gatt_pages = 256МБ >> 12 = 65536` записей GTT).
- Заполнение при инициализации (`psb_gtt_init`):
  1. страницы stolen-памяти → GTT[0..stolen_pages),
  2. «scratch page» → остальные до 3/4 границы,
  3. CI-область → с 3/4 границы (для видео),
  4. RAR-область — следом,
  5. остаток — scratch page.
- Доступ CPU к апертуре: `vaddr = ioremap(gatt_start + page*4096)`; запись CPU в окно
  попадает в физическую страницу через GTT. Экран в простейшем случае: отобразить
  страницу(ы) stolen/системной памяти через GTT и указать её в `DSPASURF` (GTT-адрес).

> Важная особенность от драйвера: «video MMU has hw bug to access 0x0D000000» —
> поэтому видео-MMU (ниже) отображает свои объекты начиная с `0xE0000000`.

### 8.4 MMU видеоблока (MSVDX/Topaz) и SGX

Для видео используется **своя** двухуровневая MMU (`imgv/psb_mmu.c`):

- Формат записи идентичен GTT: `pfn<<12 | VALID|WO|RO|CACHED` (тот же `psb_mmu_mask_pte`).
- Каталог (page directory): 4-МБ страницы — `PSB_PDE_MASK 0x003FFFFF`, `PSB_PDE_SHIFT 22`,
  PTE-сдвиг 12. Драйвер умеет «trap page faults» (pf_pd — каталог с обработкой ошибок).
- База каталога видео-MMU задаётся в регистрах MSVDX: `MMU_DIR_LIST_BASE 0x0694`,
  банк-индекс `0x0688`, управление `MMU_CONTROL0` (сброс bypass: `PSB_WMSVDX32(0, MSVDX_MMU_CONTROL0)`).
- SGX545 имеет собственную MMU/BIF (см. раздел 11.2): `EUR_CR_BIF_DIR_LIST_BASE0/1`.

Области CI и RAR отображаются в видео-MMU по адресам `0xE0000000 + ci_start` —
так видеоядро получает прямой доступ к украденным областям без участия GTT.

---

## 9. Прерывания

### 9.1 Регистры

| MMIO | Имя | Роль |
|---|---|---|
| 0x20A0 | `PSB_INT_ENABLE_R` (IER) | маска «1 = разрешено» |
| 0x20A4 | `PSB_INT_IDENTITY_R` (IIR) | «сырые» запросы; запись 1 — сброс |
| 0x20A8 | `PSB_INT_MASK_R` (IMR) | «1 = замаскировано» (драйвер пишет `~mask`) |
| 0x20AC | ISR | статус (у i9xx-стиля R/W1C-поведение на identity) |
| 0x2098 | `PSB_HWSTAM` | маска «attention» |
| 0x20C0 | `PSB_INSTPM` | внутренние маски |

Биты (из `psb_drv.h`/`sysconfig.h`):

```c
PSB_IRQ_ASLE            (1<<0)   // OpRegion ASLE (backlight/lid/hotplug от BIOS)
PSB_IRQ_PIPEB_DPBM      (1<<2)
PSB_IRQ_PIPEA_DPBM      (1<<3)
PSB_IRQ_PIPEB_EVENT     (1<<4)
PSB_IRQ_PIPEB_VBLANK    (1<<5)
PSB_IRQ_PIPEA_EVENT     (1<<6)
PSB_IRQ_PIPEA_VBLANK    (1<<7)
PSB_IRQ_SPRITEB_FLIP    (1<<8)
PSB_IRQ_SPRITEA_FLIP    (1<<9)
PSB_IRQ_PLANEB_FLIP     (1<<10)
PSB_IRQ_PLANEA_FLIP     (1<<11)
PSB_IRQ_MASTER_ERR      (1<<15)
PSB_IRQ_DISP_HOTSYNC    (1<<17)  // hot-plug/hot-unplug дисплеев
_PSB_IRQ_SGX_FLAG       (1<<18)  // SGX545 (Thalia)
_PSB_IRQ_MSVDX_FLAG     (1<<19)  // видеодекодер
```

### 9.2 Обработчик (последовательность)

```c
vdc_stat = REG32(0x20A4);                       // PSB_INT_IDENTITY_R
if (vdc_stat & (1<<18)) → dispatch SGX: читать PSB_CR_EVENT_STATUS (SGX+0x12C),
                           клирить через EVENT_HOST_CLEAR (SGX+0x134), кормить планировщик
if (vdc_stat & (1<<19)) → dispatch MSVDX: читать MSVDX_INTERRUPT_STATUS (MSVDX+0x608),
                           клирить MSVDX_INTERRUPT_CLEAR (MSVDX+0x60C), завершить job
if (vdc_stat & (1<<7)/(1<<5)) → vblank pipe A/B: PIPEASTAT (0x70024) — читать, писать
                           назад для очистки (R/W1C), drm_handle_vblank()
REG32(0x20A4) = vdc_stat; (void)REG32(0x20A4);  // подтверждение всех обработанных
```

Статистика пайпа (`PIPEASTAT`, R/W1C): `PIPE_VBLANK_STATUS`, `PIPE_FIFO_UNDERRUN`,
`PIPE_VBLANK_INTERRUPT_ENABLE` (в PIPECONF-блоке статуса) и т. п. — формат i9xx.

Разрешение: `REG32(0x20A8) = ~vdc_irq_mask; REG32(0x20A0) = vdc_irq_mask;`
(маска → IMR инверсно, разрешение → IER). Vblank включается битами в PIPESTAT-регистрах.

### 9.3 MSI

MSI разрешается (INF `MSISupported=1`, в коде `pci_enable_msi`) — на CDV используются
адрес/данные в конфиг-пространстве 0x94/0x98. Обработчик единый, источник различается по
битам IIR. Если самописная ОС не хочет MSI — можно работать в legacy-режиме (линия INT#).

### 9.4 SGX-события

Внутри SGX свой «event-механизм»: `EUR_CR_EVENT_STATUS 0x012C` (биты: MASTER_INTERRUPT 1<<31,
TA_DPM_FAULT 1<<28, TWOD_COMPLETE 1<<27, PIXELBE_END_RENDER 1<<18, SW_EVENT 1<<14,
TA_FINISHED 1<<13, TA_TERMINATE 1<<12, DPM_* и т. д.), `EVENT_HOST_ENABLE 0x0130`,
`EVENT_HOST_CLEAR 0x0134`, `EVENT_HOST_ENABLE2/CLEAR2/STATUS2 0x0110/0x0114/0x0118`
(BIF_REQUESTER_FAULT 1<<4), кик — `EUR_CR_EVENT_KICK 0x0AC8` (бит NOW) и
`EVENT_KICK2` (для мультиядерных вариантов). MSVDX-событие приходит в общий IIR битом 1<<19.

---

## 10. Видеоускорение

### 10.1 Что ускорено и как это выглядит в Windows

`igddxva32.dll` реализует **DXVA 1.0 (DXVA2 DDI через WDDM)** с профилями (строки из DLL):

| Семейство | Режимы (строки DLL) |
|---|---|
| MPEG-1/2 | `MPEG1_VLD`, `MPEG2_VLD`, `MPEG2_MC`, `MPEG2_iDCT` |
| MPEG-4 | `MPEG4_VLD`, `MPEG4_VLD_Simple_Only`, `MPEG4_VLD_Adv_Simple_NoGMC`, `MPEG4_VLD_Adv_Simple_GMC` |
| H.264 | `H264_VLD_No_Filmgrain`, `H264_VLD_IntraDeblock_OOLD`, `DXVA_ModeH264_VLD_WithFMOASO_NoFGT` |
| VC-1/WMV9 | `VC1_VLD`, `VC1_MC`, `WMV9/VC1 Decode Mode` |

Классы декодеров в DLL: `CMpeg2VldDecoder`, `CMpeg2MCDecoder`, `CMpeg4VldDecoder`,
`CH264VldDecoder`, `CVC1VldDecoder`, `CVC1MCDecoder`, `CVC1` — т. е. есть как полная
VLD (bitstream → Pictures напрямую железом), так и MC/iDCT-режимы. Реестровая ветка:
`Software\Intel\Display\DXVA`.

Поток данных в Windows: плеер → DXVA-декодер UMD (`igddxva32.dll`) → «мост» PVRSRV
(наш список: `PVRSRV_BRIDGE_MSVDX_CONTEXT_CREATED/DESTROYED`, `INITFIRMWARE`,
`SUBMITEX`, `UPDATEMMUFLAGS`, `GETMISCINFO`, `HWRECOVERY`, `TRIGGER_INTERRUPT`) → KMD
(`igdkmd32.sys`) → регистры MSVDX. Прошивка передаётся с хоста через
`MSVDX_INITFIRMWARE` — в Linux-пакете это ровно файл `lib/firmware/msvdx_fw.bin`.

**Энкодер Topaz в Windows-драйвере не задействован** (строк topaz в DLL нет), хотя прошивки
`topaz_fw.bin`/`topazsc_fw.bin` есть в Linux-выпуске (использовались VAAPI-драйвером
`pvr_drv_video.so`). В коде ядра остались хуки `IS_TOPAZ`, `PSB_PWRGT_VID_ENC_MASK`.

### 10.2 Регистры MSVDX (база MMIO+0x90000, окно 64 КБ)

| Смещение | Имя | Назначение |
|---|---|---|
| 0x0080 | `MSVDX_MTX_KICK` | пнуть MTX (исполнение прошивки) |
| 0x0088 | `MSVDX_MTX_KICKI` | кик прерыванием |
| 0x00F8 | `MTX_REGISTER_READ_WRITE_DATA` | данные для R/W core-регистра MTX |
| 0x00FC | `MTX_REGISTER_READ_WRITE_REQUEST` | запрос R/W: номер core-рег, MTX_RNW (направление), MTX_DREADY |
| 0x0104 | `MTX_RAM_ACCESS_DATA_TRANSFER` | данные RAM-доступа MTX (загрузка прошивки/стека) |
| 0x0108 | `MTX_RAM_ACCESS_CONTROL` | команда RAM-доступа (адрес, направление, размер) |
| 0x010C | `MTX_RAM_ACCESS_STATUS` | статус (готовность) |
| 0x0200 | `MTX_SOFT_RESET` | сброс MTX |
| 0x0208 | `MTX_SYSC_TIMERDIV` | делитель системного таймера MTX |
| 0x0300 | (область) | **Comms area** — разделяемые данные с прошивкой (статусы, аргументы команд), заканчивается на `MSVDX_COMMS_AREA_END 0x03000` |
| 0x0600 | `MSVDX_CONTROL` | общий контроль; биты soft-reset: core (0x100), FE, BE, VEC_MEMIF, VEC_RENDEC |
| 0x0608 | `MSVDX_INTERRUPT_STATUS` | флаги: MTX_IRQ, MMU_FAULT_IRQ (0xF00) и др. |
| 0x060C | `MSVDX_INTERRUPT_CLEAR` | R/W1C-очистка |
| 0x0620 | `MSVDX_MAN_CLK_ENABLE` | ручное включение тактов: CORE, VDEB_PROCESS, VDEB_ACCESS, VDMC, VEC_ENTDEC, VEC_ITRANS, MTX (`clk_enable_all`) |
| 0x0664/0x0064/0x0068… | WDT FE/BE | watchdog-таймеры FE (`FE_WDT_CONTROL 0x64`, `FE_WDTIMER 0x68`, `COMPAREMATCH 0x6C`) и BE (0x70/…) |
| 0x0688 | `MMU_BANK_INDEX` | индекс банка для доступа к таблицам MMU |
| 0x0694 | `MMU_DIR_LIST_BASE` | физический адрес каталога видео-MMU |
| (0x06xx) | `MMU_CONTROL0` | управление: сброс bypass-битов (`0` = MMU включена), INVALDC (1<<3) |
| 0x06xx | `RENDEC_CONTROL0/1`, `RENDEC_BUFFER_SIZE`, `RENDEC_BASE_ADDR0/1` | буферы реконструкции |

`MSVDX_CORE_REV` — ревизия: `(rev & 0xFFFFFF) < 0x020000` → MTX-память 16 КБ, иначе 40 КБ.

### 10.3 Прошивка MSVDX: формат и загрузка

Файл `msvdx_fw.bin` (31 844 байта в выпуске 1.0.3_bee) — заголовок (u32 LE):

```c
struct msvdx_fw {
    uint32_t ver;            // наблюдаемое значение 0x000003B0
    uint32_t text_size;      // 0x00000B32  (в словах MTX)
    uint32_t data_size;      // 0x000003F2
    uint32_t data_location;  // 0x82882D00  — MTX-адрес данных (базовый MTX-адрес данных 0x82880000)
};
// далее: text (instr) + data; прочие константы загрузчика:
#define MSVDX_MTX_DATA_LOCATION 0x82880000
#define STACKGUARDWORD          0x10101010
#define FIRMWAREID              0x014D42AB
#define UPLOAD_FW_BY_DMA 1      // используется DMA-путь загрузки
```

Загрузка (по `psb_msvdxinit.c`):

```text
1. Включить такты: MSVDX_MAN_CLK_ENABLE = clk_enable_all
2. MMU: PSB_WMSVDX32(0, MSVDX_MMU_CONTROL0)        // убрать bypass
3. Выделить RENDEC A/B (RENDEC_BASE_ADDR0/1, BUFFER_SIZE), каталог видео-MMU → 0x0694
4. Выделить буфер прошивки (mtx_mem_size = 16КБ/40КБ по CORE_REV, +4КБ)
5. Скопировать msvdx_fw.bin, записать FIRMWAREID и STACKGUARDWORD по канону прошивки
6. Залить text/data в MTX: через MTX_RAM_ACCESS_CONTROL/DATA_TRANSFER (или DMA при
   UPLOAD_FW_BY_DMA), адреса от MSVDX_MTX_DATA_LOCATION
7. Настроить MTX core-регистры через MTX_REGISTER_READ_WRITE_REQUEST/DATA
   (записать точку входа, стек), MTX_SYSC_TIMERDIV
8. MTX_SOFT_RESET → сброс; затем MSVDX_MTX_KICK = 1 — старт прошивки
9. Ждать MSVDX_INTERRUPT_STATUS.MTX_IRQ (поллинг или прерывание), очистить 0x060C
10. Далее — протокол команд через comms area (0x3000) и kick'и
```

Задача на декодирование подаётся в очередь (`msvdx_queue`/`deblock_queue`), KMD формирует
командный буфер прошивке через comms area; готовность — MTX IRQ + статус в comms.

### 10.4 Что это значит для самописной ОС

- Путь «VAAPI как в Linux» здесь неработоспособен напрямую (VAAPI-драйвер — тоже blob,
  `pvr_drv_video.so`), но **ядерная часть полностью открыта**: файлы
  `imgv/psb_msvdx*.c`, `psb_buffer.c`, `psb_mmu.c` — готовый референс под GPL.
- Минимальный декодер «своими руками»: инициализация по 10.3 + формат команд буфера
  придётся восстанавливать по `psb_msvdx.c` (структуры comms area в `psb_msvdx.h`)
  и/или дизассемблированием прошивки. Прошивку разрешено поставлять с ОС (см. `license.txt`).
- Альтернатива без MSVDX: программное декодирование; аппаратное ускорение scaler'а —
  через Overlay (`OV_OVADD 0x30000`, YUV-гамма `OV_OGAMC0..5`) — это тривиально и полезно
  для видеоплеера.

---
## 11. 3D-ускорение: SGX545

### 11.1 Регистры ядра SGX545 (база MMIO+0x80000, окно 16 КБ)

Имена в двух нотациях: `EUR_CR_*` (Imagination, `sgx545defs.h`, 1148 определений) и
`PSB_CR_*` (Intel-заголовок) — адреса совпадают:

| Смещение | Имя | Назначение |
|---|---|---|
| 0x0000 | `EUR_CR_CLKGATECTL` | тактирование подсистем: AUTO_MAN (1<<24), USE_CLKG [21:20], DPM [17:16], TA [13:12], TSP [9:8], ISP [5:4], 2D [1:0]; значения: 0=on, 1=off, 2=auto |
| 0x001C | `EUR_CR_CORE_ID` | [31:16] ID ядра, [15:0] конфигурация |
| 0x0020 | `EUR_CR_CORE_REVISION` | [31:24] designer, [23:16] major, [15:8] minor, [7:0] maintenance (ревизия «1.1.x», `SGX_CORE_REV=10131`) |
| 0x0080 | `EUR_CR_SOFT_RESET` | сброс блоков: BIF(0), 2D(1), DPM(2), TA(3), USE(4), ISP(5), TSP(6) |
| 0x0110/0x0114/0x0118 | `EVENT_HOST_ENABLE2/CLEAR2/STATUS2` | расширенные события: BIF_REQUESTER_FAULT (1<<4) |
| 0x012C | `EUR_CR_EVENT_STATUS` | статус событий (см. 9.4) |
| 0x0130/0x0134 | `EVENT_HOST_ENABLE/CLEAR` | маска/очистка событий |
| 0x0A0C–0x0A48 | `EUR_CR_USE_CODE_BASE0..15` | базы USE-кода по доменам: [26:25] DM (0=vertex, 1=pixel, 3=EDM), [24:0] адрес (выравнивание 128 байт) |
| 0x0AB8 | `EUR_CR_PDS_EXEC_BASE` | база исполнителя PDS (выравнивание 1 МБ) |
| 0x0AC4/0x0AC8 | `EUR_CR_EVENT_KICKER/KICK` | адрес kicker-кода / бит NOW (1<<0) — запуск |
| 0x0C00 | `EUR_CR_BIF_CTRL` | BIF: CLEAR_FAULT (1<<4), INVALDC (1<<3), FLUSH (1<<2) |
| 0x0C04 | `EUR_CR_BIF_INT_STAT` | статистика ошибок BIF |
| 0x0C08 | `EUR_CR_BIF_FAULT` | [14] R/W, [13:0] источник: CACHE/TA/VDM/2D/PBE/TSP/ISP/USSEPDS/HOST |
| 0x0C38 | `EUR_CR_BIF_DIR_LIST_BASE1` | каталог MMU (bank 1) |
| 0x0C78/0x0C7C | `EUR_CR_BIF_BANK0/BANK1` | индексы банков (2D/3D/EDM/HOST/TA) |
| 0x0C84 | `EUR_CR_BIF_DIR_LIST_BASE0` | каталог MMU (bank 0) |
| 0x0C88/0x0CAC | `EUR_CR_BIF_2D_REQ_BASE / 3D_REQ_BASE` | «представительские» адреса запросов 2D/3D |
| +0x4000 | 2D слейв-порт | FIFO-протокол 2D-блиттера (см. 11.4) |

### 11.2 MMU/BIF SGX

SGX использует свою MMU («BIF» — Bus Interface Unit) с каталогами `BIF_DIR_LIST_BASE0/1`
(два банка — обычно 0 для 3D, 1 для хоста/2D). Формат страниц — обычный для SGX
(`sgxmmu.h`): 4 КБ страницы, PTE с битами present/RO/…(детально в hwdefs). Драйвер
выделяет каталоги и пишет их базу при инициализации контекстов.

### 11.3 PowerVR Services 4 (архитектура драйвера)

Windows `igdkmd32.sys` и Linux-модуль — одна и та же архитектура «Services»:

- **Bridge (мост)** — единственный канал UM→KM: ioctl с ID команды. Список команд SGX/MSVDX
  (в Windows-драйвере найдены ровно эти строки):

```
SGX:  GETCLIENTINFO, RELEASECLIENTINFO, GETINTERNALDEVINFO, DOKICK,
      GETPHYSPAGEADDR, READREGISTRYDWORD, 2DQUERYBLTSCOMPLETE, SUBMITTRANSFER,
      GETMISCINFO, SGXINFO_FOR_SRVINIT, DEVINITPART2, FIND/ADD/UNREFSHAREDPBDESC,
      REGISTER/UNREGISTER_HW_RENDER_CONTEXT, REGISTER_HW_TRANSFER_CONTEXT,
      FLUSH_HW_RENDER_TARGET, GETMMUPDADDR, SCHEDULE_PROCESS_QUEUES,
      READ_HWPERF_CB, SUBMIT2D, REGISTER_HW_2D_CONTEXT (+ нумерация:
      PVRSRV_BRIDGE_SGX_CMD_BASE + 0..N — см. sgx_bridge.h)
MSVDX: CONTEXT_CREATED, CONTEXT_DESTROYED, GETMISCINFO, HWRECOVERY,
      INITFIRMWARE, SUBMITEX, TRIGGER_INTERRUPT, UPDATEMMUFLAGS
```

- **Kernel CCB** — командный кольцевой буфер KM-уровня (команды `SGXMKIF_CMD_TA`,
  `SGXMKIF_CMD_3D`, `SGXMKIF_CMD_2D`, `SGXMKIF_CMD_TRANSFER`…), лежит в разделяемой памяти;
  UM кладёт команды, делает `DOKICK`, KM пишет их в графическую память и пинает ядро
  через `EUR_CR_EVENT_KICK`.
- **Инициализация** (соответствие подтверждено и в Windows-строках, и в исходниках):
  1. KM: `SGXINFO_FOR_SRVINIT` отдаёт UM карту устройства (адреса, ревизию `CORE_REVISION`);
  2. UM создаёт kernel CCB, HostCtl, TA/3D-ctl, event-kicker и т. д.;
  3. `SGX_DEVINITPART2` передаёт их в KM (структура `SGX_BRIDGE_INIT_INFO`: хэндлы
     `hKernelCCBMemInfo`, `hKernelCCBCtlMemInfo`, `hKernelCCBEventKickerMemInfo`,
     `hKernelSGXHostCtlMemInfo`, `hKernelSGXTA3DCtlMemInfo`, `aui32HostKickAddr[]`,
     init-скрипты `SGX_INIT_SCRIPTS` (только WRITE_HW_REG/HALT), build-опции, размеры структур, сигнатурные буферы TA/3D);
  4. KM выполняет init-скрипты (регистровые записи: `ClkGateCtl`, `EDMTaskReg0/1`…),
     пишет `ui32InitStatus=0` и пинает **микроядро** (`EUR_CR_EVENT_KICK.NOW` /
     `EVENT_KICK2.NOW`), затем ждёт статус в `SGXMKIF_HOST_CTL.ui32InitStatus`;
  5. рендер-контексты регистрируются через `REGISTER_HW_RENDER_CONTEXT`
     (та же схема для transfer/2D).
- **Микроядро SGX** — критичный проприетарный компонент: в KM-исходниках его **нет**
  (init-скрипты содержат только регистровые записи). Оно поставляется в составе
  клиентской библиотеки DDK: Linux — `libsrv_um.so.1.7.862890`; Windows — внутри
  `igdumd32.dll`/`imghal64.dll` (там же компилятор USC2). Версия DDK:
  `PVRVERSION 1.7.17.862890` (`pvrversion.h`), релизный суффикс «_bee», `PVR_BUILD_DIR="pc_i686_cedarview_linux"`.
- **Строки из Windows KMD** (свидетельство той же логики): `SGXInit: Device not of type SGX`,
  `SGXInit: Incompatible HW core rev (%x) and SW core rev (%x)`, `Mismatch in driver and
  microkernel build options … Please check sgx_options.h`, `HWRecoveryResetSGX: SGX Hardware
  Recovery triggered`, `SGX Kernel CCB WO/RO`, `SGX Host control`, `SGX TA/3D control`,
  `IMG_FIRMWARE_SELECT`, `IMG_FW_ACTIVITY_WDT`, `IMG_SYNC_FW_UPLOAD`.

### 11.4 2D-блиттер SGX (протокол слейв-порта)

2D-движок программируется потоком «блоков» через слейв-порт (база +0x4000, статусы
`PSB_CR_2D_BLIT_STATUS 0x0E04` — BUSY 1<<24, COMPLETE; FIFO: `PSB_CR_2D_SOCIF 0x0E18`).
Блоки (старшие полубайты заголовков):

```
0x0 CLIP   0x1 PAT    0x2 CTRL   0x3 SRC_OFF   0x4 MASK_OFF   0x7 FENCE
0x8 BLIT   0x9 SRC_SURF   0xA DST_SURF   0xB PAT_SURF   0xC SRC_PAL   0xD PAT_PAL
0xE MASK_SURF   0xF FLUSH
```

Блит задаётся: форматами/адресами/страйдами SRC/DST/PAT (`PSB_2D_SRC_8888ARGB=0x00060000`
и др.), ROP3A/ROP3B (`SRCCOPY=0xCCCC`, `PATCOPY=0xF0F0`), поворотом (0/90/180/270),
color-key, alpha. Полные битовые поля — в `psb_reg.h` (перечислены в Приложении А).
Контекст 2D регистрируется мостом `REGISTER_HW_2D_CONTEXT`, отправка — `SUBMIT2D`.

> То есть даже «простое» 2D-ускорение на этой платформе идёт через стек PowerVR
> (микроядро управляет и 2D-движком). Написать «прямой» драйвер 2D поверх слейв-порта
> теоретически можно (протокол блоков полностью известен), но после инициализации ядра.

### 11.5 Реалистичная оценка для самописной ОС

- Минимум-программа (консоль/LFB/vblank/тайминги) не требует SGX вообще — см. раздел 14.
- 3D на SGX545 самостоятельной реализацией **нецелесообразно**: нужен образ микроядра
  (извлекается только из blob'ов), полная реализация Services (CCB, MMU-контексты,
  компилятор USSE из libusc) — это месяцы реверс-инжиниринга.
- Рабочий путь: перенос GPL-ядра `drivers/staging/cdv` (весь srvkm уже портирован под
  Linux и в этом отчёте задокументирован) + использование клиентов из Linux-пакета;
  либо запуск их же под своей ОС, реализовав только примитивы окружения Linux-модуля
  (PCI, ioremap, IRQ, kthread, alloc pages) — объём ограничен и известен.

---

## 12. OpRegion (ACPI/ASLE) и VBT

### 12.1 OpRegion

Адрес региона берётся из конфигурационного регистра `PCI_ASLS 0xFC`; прерывание BIOS
сигнализирует через `PCI_ASLE 0xE4`. Сигнатура региона — `IntelGraphicsMem`.

| Смещение | Секция |
|---|---|
| 0x000 | Header: `signature[16]`, `size`, `opregion_ver`, `bios_ver[32]`, `vbios_ver[16]`, `driver_ver[16]`, `mboxes` |
| 0x100 | ACPI mailbox: `drdy`, `csts`, `cevt`, `didl[8]` (поддерживаемые дисплеи), `cpdl[8]`, `cadl[8]`, `nadl[8]`, `aslp`, `tidx`, `chpd`, `clid` (крышка), `cdck` (док), `sxsw`, `evts`, `cnot`, `nrdy`; внутри: `CLID 0x1AC`, `CDCK 0x1B0` |
| 0x200 | SWSCI mailbox |
| 0x300 | ASLE: `ardy`, `aslc` (команда), `tche`, `alsi` (освещённость), `bclp` (яркость 0..255 + валид-бит 1<<31), `pfit`, `cblv` (текущая яркость), `bclm[20]` (таблица уровней), `cpfm`, `epfm`, `plut[74]`, `pfmb` (PWM freq/min) |
| 0x400 | **VBT** (Video BIOS Table) |

Mailbox-биты: `MBOX_ACPI (1<<0)`, `MBOX_SWSCI (1<<1)`, `MBOX_ASLE (1<<2)`.
Команды ASLE: `SET_ALS_ILLUM (1<<0)`, `SET_BACKLIGHT (1<<1)`, `SET_PFIT (1<<2)`,
`SET_PWM_FREQ (1<<3)`; ответы-статусы: `*_FAILED (1<<10/12/14/16)`, `BCLP_VALID (1<<31)`.

Для самописной ОС: достаточно поддержать чтение `ASLS` и (опционально) обработку ASLE
бита прерывания `1<<0` — это даёт корректную подсветку/крышку на ноутбуках.

### 12.2 VBT

VBT (тоже доступен через OpRegion 0x400) парсится `psb_intel_bios.c`: general
definitions, LVDS (panel power sequencer — задержки `PP_ON/OFF_DELAYS`, SSC-частота
`lvds_ssc_freq` и флаг `lvds_use_ssc`), child device tree (порядок портов, DDC-пины,
DDI-выбор для HDMI/DP — поле `ddi_select` используется при программировании Lane).
Если VBT недоступен, драйвер применяет дефолты и «NonEDIDMode» из INF.

---

## 13. Драйвер Windows XP (IEGD/EMGD 1.15)

XP-пакет — это **IEGD/EMGD** (Embedded Graphics Driver), сборка
`EMGD.CDV-WINXP--EMGD_1_15_CDV_89` (путь PDB в `iegdmini.sys`). Модель — XPDM
(до-WDDM): видео-мини-порт + отдельные драйверы-«компоненты».

```
iegd.inf                     ; PCI\VEN_8086&DEV_0BE0..0BE6
AddService = iegdmini        ; мини-порт (iegdmini.sys)
AddService = analog/lvds/hdmi/dp/softpd ; дочерние сервисы-коннекторы (.sys)
iegd.Miniport  = iegdmini.sys
iegd.Display_cdv = iegddis.dll          ; дисплейный драйвер GDI
iegd.PortDrvs_cdv = analog.sys, lvds.sys, hdmi.sys, dp.sys, softpd.sys
iegd.Copp_cdv  = iegdcagt.cpa, iegdckey.vp
igd3dcdv.dll               ; 3D (PowerVR) — аналогично igdumd
IntcDAud.sys/.inf          ; Display Audio (HDMI) 6.14.0.3081
```

Интересно для самописной ОС: XPDM-модель ближе к «голому железу» — мини-порт
использует `VideoPortGetDeviceBase/MapMemory`, работает с регистрами напрямую, а
коннекторы вынесены в отдельные .sys. Строки подтверждают использование PVR-сервисов
и SGX (тот же bridge), а также `SGXApertureSize` и пр.

Для сравнительного анализа полезен и EMGD-пакет (`EMGD_CDV_1.15.1_GC_3278.exe`,
74 МБ, archive.org) — там есть документация и CED-конфигуратор.

---
## 14. План драйвера для самописной ОС

Ниже — проверенная последовательность действий, собранная из кода драйвера (Linux-версии,
полностью совпадающей по железу с Windows-драйвером). Код-скетчи — иллюстративные.

### Этап 0. Обнаружение и маппинг

```c
if (pci->vendor == 0x8086 && (pci->device & 0xFFF0) == 0x0BE0) → это GMA3600
mmio = iomap(BAR0, 0xC0000);          // весь регистровый блок
// сохранить PCI command: включить Memory Space | Bus Master
read stepping: bus 0, dev 0, fn 0, offset 0x08 (revision) — <4 → «sample» workaround
core_freq = {160,200,267,320,356,400}[ (REG(0x20C8)>>4)&0xF ];
```

### Этап 1. GTT и линейный framebuffer (минимальный драйвер)

```c
pgetbl = REG32(0x2020);
gtt_phys = pgetbl & 0xFFFFF000;
stolen   = pcie_cfg_read32(0,0,0, 0x5C);
// 1) включить:
cfg_write16(0,0,0, 0x52, cfg_read16(0,0,0,0x52) | 0x4);
REG32(0x2020) = gtt_phys | 1; (void)REG32(0x2020);
// 2) gtt = iomap(gtt_phys, 256*1024);
// 3) отобразить экран: возьмём страницы в начале stolen (или системные страницы):
for (i = 0; i < npages; i++)
    gtt[i] = ((page_pfn + i) << 12) | 1;          // PTE: pfn<<12 | VALID
(void) gtt[npages-1];                              // flush-постинг
// 4) экран в апертуре: fb = iomap(0x40000000, w*h*4); memset(fb) — уже видно,
//    если BIOS оставил пайп/плоскость включёнными (обычно так: BIOS настроил LVDS).
//    Если нет — DSPASURF (0x7019C) = 0x40000000 (GTT-адрес), DSPABASE (0x70184) = offset,
//    DSPASTRIDE (0x70188) = w*4, DSPACNTR (0x70180) = 0x48000000|формат (enable+gamma+pipe A).
```

Такой «fbdev за один вечер» полностью работоспособен: VGA-текст можно продолжать
использовать параллельно до первого modesetting.

### Этап 2. Переход из VGA и базовый modesetting

```c
// выключить VGA-режим:
REG32(0x71400) |= VGA_DISABLE (бит 31);      // VGACNTRL — i9xx-совместимо
// панель (ноутбук): PP_CONTROL (0x61204) |= 1<<31 (POWER_TARGET_ON)… wait PP_STATUS
// тайминги и DPLL — по разделу 7.2/7.6:
//   DPLL_x, DPIO (sb_read/sb_write), HTOTAL..VSYNC, DSPxSIZE/POS, PIPExSRC,
//   PIPEACONF, DSPACNTR, DSPABASE+SURF, палитра при 8bpp
```

Порядок именно такой, как в `cdv_intel_crtc_mode_set` (раздел 7.6): DPLL→DPIO→LVDS-пины
(до включения VCO!)→VCO enable→ждать LOCK→тайминги→pipeconf→plane→vblank.

### Этап 3. EDID и горячее подключение

```c
// GMBUS: GMBUS0=пара/скорость, GMBUS1=cmd(read, addr<<1), поллинг GMBUS2.HW_RDY,
// данные GMBUS3. 128 байт EDID с 0xA0. Fallback: bit-bang через GPIOx 0x5010+.
// hot-plug: PORT_HOTPLUG_EN 0x61110 (бит на порт) + IER бит 1<<17 (DISP_HOTSYNC).
```

### Этап 4. Прерывания и vblank

```c
REG32(0x20A8) = ~mask;                  // IMR: инверсная маска
REG32(0x20A0) = mask;                   // IER: разрешить (например, 1<<7 PIPEA_VBLANK, 1<<0 ASLE)
// в обработчике: vdc=REG32(0x20A4); ... REG32(0x20A4)=vdc; (void)REG32(0x20A4);
// vblank-статус: PIPEASTAT 0x70024 (R/W1C).
// MSI: по желанию; иначе legacy INT#.
```

### Этап 5. Видеодекодер MSVDX

Опорный код — `imgv/psb_msvdx*.c` (GPL). Шаги — раздел 10.3; прошивку
`msvdx_fw.bin` можно включить в поставку ОС. Формат посылок после загрузки — comms area
(0x3000) + kick; протокол детально виден в `psb_msvdx.c` (структуры job'ов в
`psb_msvdx.h`). Разумная стратегия: реализовать «порт» этих файлов на API своей ОС.

### Этап 6. SGX545 (опционально, 3D)

Реализовать архитектуру PVR Services 1.7.862890: перенести `pvr/services4/srvkm/**`
(GPL), поднять bridge (ioctl), kernel CCB, и взять пользовательскую часть из Linux-пакета
(`libsrv_um.so` и GL/EGL). Загрузка микроядра произойдёт в ходе `SGX_DEVINITPART2`+
kick-механизма (раздел 11.3). Всё, что нужно знать о железе, — в `sgx545defs.h`/`sgxmmu.h`.

### Типичные грабли (из комментариев в коде)

- «video MMU has hw bug to access 0x0D000000» → видеобъекты располагать с 0xE0000000.
- Ревизия хост-бриджа <4 (sample stepping) → cache workaround.
- На CDV запись `DSPABASE` и `DSPASURF` — **обе** обязательны (BASE=offset, SURF=base).
- LVDS-пины включать **до** `DPLL_VCO_ENABLE`.
- После серии записей GTT — контрольное чтение последней записи (постинг).
- `PIPE_FIFO_UNDERRUN` лечится `DSPCHICKENBIT` (0x70400) и водяными знаками DSPFW*.
- Тайминги-регистры пишутся со сдвигом на −1 (i9xx-конвенция).
- Не трогать пайп C и MIPI-блок на десктопных платах (это Medfield-наследие).

---

## Приложение А

### А.1 Дисплейные регистры (полный извлечённый список, `psb_intel_reg.h`)

Тайминги и пайпы:

```
HTOTAL_A 0x60000  HBLANK_A 0x60004  HSYNC_A 0x60008  VTOTAL_A 0x6000C
VBLANK_A 0x60010  VSYNC_A 0x60014  PIPEASRC 0x6001C BCLRPAT_A 0x60020 VSYNCSHIFT_A 0x60028
HTOTAL_B 0x61000 … VSYNCSHIFT_B 0x61028      HTOTAL_C 0x62000 … VSYNCSHIFT_C 0x62028
PIPEACONF 0x70008  PIPEBCONF 0x71008  PIPECCONF 0x72008
PIPEASTAT 0x70024  PIPEBSTAT 0x71024  PIPECSTAT 0x72024
PIPEAFRAMEHIGH 0x70040 PIPEAFRAMEPIXEL 0x70044 (B/C: 0x71040/44, 0x72040/44)
PIPEBGCMAXRED/GREEN/BLUE 0x71010/14/18
```

PLL/такты:

```
DPLL_A 0x06014  DPLL_B 0x06018  DPLL_A_MD 0x0601C  DPLL_B_MD 0x06020  DPLL_TEST 0x606C
FPA0 0x06040 FPA1 0x06044 FPB0 0x06048 FPB1 0x0604C   (на CDV фактически через DPIO)
DPLL_VCO_ENABLE (1<<31) DPLL_DVO_HIGH_SPEED (1<<30) DPLL_SYNCLOCK_ENABLE (1<<29)
DPLL_VGA_MODE_DIS (1<<28) DPLL_MODE_MASK (3<<26) DPLL_LOCK (1<<15, CDV)
DPLL_MD_UDI_DIVIDER_MASK 0x3F000000 (SHIFT 24), VGA_UDI_DIVIDER 0x003F0000 (16),
UDI_MULTIPLIER 0x00003F00 (8), VGA_UDI_MULTIPLIER 0x3F (0)
SB_PCKT 0x02100 (opcode[31:16]: 0 READ/1 WRITE, dest[15:8]=0x88 DPLL, byte-en[7:4], BUSY bit0)
SB_DATA 0x02104  SB_ADDR 0x02108  DPIO_CFG 0x02110
_SB_M_A 0x8008  _SB_M_B 0x8028   _SB_N_VCO_A 0x8014  _SB_N_VCO_B 0x8034
SB_REF_DPLLA 0x8010  SB_REF_DPLLB 0x8030   PSB_LANE0 0x120  LANE1 0x220  LANE2 0x2320  LANE3 0x2420
INTEL_CDV_DISP_CLK_FREQ 0x20C8   DSPCLK_GATE_D 0x6200  RAMCLK_GATE_D 0x6210
MRST_DPLL_A 0x0F014  MDFLD_DPLL_B 0x0F018  MRST_FPA0 0x0F040 (Medfield-наследие)
```

Коннекторы:

```
ADPA 0x61100  PORT_HOTPLUG_EN 0x61110  PORT_HOTPLUG_STAT 0x61114
HDMIPHYMISCCTL 0x61134  SDVOB 0x61140 (HDMIB_CONTROL)  SDVOC 0x61160
LVDS 0x61180  DP_B 0x64100  DP_C 0x64200
DPB_AUX_CH_CTL 0x64110 DATA1..5 0x64114..0x64124   DPC_AUX_CH_CTL 0x64210 DATA1..5 0x64214..0x64224
CRT_HOTPLUG_DETECT_MASK 0x000000F8
```

Панель/подсветка/фиттер:

```
PP_STATUS 0x61200  PP_CONTROL 0x61204  PP_ON_DELAYS 0x61208  PP_OFF_DELAYS 0x6120C  PP_DIVISOR 0x61210
BLC_PWM_CTL2 0x61250  BLC_PWM_CTL 0x61254  (+ _C: 0x62250/0x62254)
PFIT_CONTROL 0x61230  PFIT_PGM_RATIOS 0x61234  PFIT_AUTO_RATIOS 0x61238
HISTOGRAM_INT_CONTROL 0x61268  HISTOGRAM_LOGIC_CONTROL 0x61260
PWM_CONTROL_LOGIC 0x61250  PWM_PHASEIN_VB_COUNT 0x1F00  PWM_PHASEIN_INC 0x1F
```

I2C/GPIO:

```
GPIOA 0x5010 GPIOB 0x5014 GPIOC 0x5018 GPIOD 0x501C GPIOE 0x5020 GPIOF 0x5024 GPIOG 0x5028 GPIOH 0x502C
GMBUS0 0x5100 GMBUS1 0x5104 GMBUS2 0x5108 GMBUS3 0x510C GMBUS4 0x5110 GMBUS5 0x5120
```

Плоскости/курсоры/палитра/VGA:

```
DSPARB 0x70030  DSPFW1 0x70034  DSPFW2 0x70038  DSPFW3 0x7003C  DSPFW4 0x70070  DSPFW5 0x70074
DSPFW6 0x70078  DSPCHICKENBIT 0x70400
DSPACNTR 0x70180 DSPABASE 0x70184 DSPALINOFF 0x70184 DSPASTRIDE 0x70188 DSPAPOS 0x7018C
DSPASIZE 0x70190 DSPAKEYVAL 0x70194 DSPAKEYMASK 0x70198 DSPASURF 0x7019C DSPATILEOFF 0x701A4
DSPB* 0x711xx  DSPC* 0x721xx (+ DSPCKEYMIN/MAX/MSK 0x72194/A0/98)
CURACNTR 0x70080 CURABASE 0x70084 CURAPOS 0x70088 (B: 0x700C0..8, C: 0x700E0..8)
CURSOR_MODE_DISABLE 0x00  CURSOR_MODE_64_32B_AX 0x07  CURSOR_POS_MASK 0x7FF  CURSOR_POS_SIGN 0x8000
PALETTE_A 0x0A000  PALETTE_B 0x0A800  PALETTE_C 0x0AC00
VGACNTRL 0x71400  VGA_SR_INDEX 0x3C4  VGA_SR_DATA 0x3C5
SWF0..6 0x71410..28  SWF00..06 0x70410..28  SWF30..32 0x72414..1C
MRST_DSPABASE 0x7019C  MRST_DSPBBASE 0x7119C  MDFLD_DSPCBASE 0x7219C
```

Overlay:

```
OV_OVADD 0x30000  OV_DOVASTA 0x30008  OV_OGAMC5..0 0x30010..0x30024
OVC_OVADD 0x38000 OVC_DOVCSTA 0x38008 OVC_OGAMC5..0 0x38010..0x38024   (OV_C_OFFSET 0x08000)
```

Прерывания и прочее (общая страница):

```
IER 0x020A0  IIR 0x020A4  IMR 0x020A8  ISR 0x020AC  PSB_HWSTAM 0x2098  PSB_INSTPM 0x20C0
PSB_MSVDX_CLOCKGATING 0x2064  FW_BLC_SELF 0x20E0  MRST_PERF_MODE 0x20F4
MIPI 0x61190  MIPI_C 0x62190 (+ весь DSI-блок 0xB0xx/0xB1xx — Medfield)
```

### А.2 Регистры SGX545 (`psb_reg.h` / `sgx545defs.h` — ядро)

```
CR_CLKGATECTL 0x0000 (AUTO_MAN 1<<24; USE/DPM/TA/TSP/ISP/2D поля по 2 бита: 0 on/1 off/2 auto)
CR_CORE_ID 0x001C  CR_CORE_REVISION 0x0020  CR_DESIGNER_REV_FIELD1/2 0x0024/0x002C
CR_SOFT_RESET 0x0080 (BIF0 2D1 DPM2 TA3 USE4 ISP5 TSP6)
CR_EVENT_HOST_ENABLE2 0x0110  CR_EVENT_HOST_CLEAR2 0x0114  CR_EVENT_STATUS2 0x0118
CR_EVENT_STATUS 0x012C  CR_EVENT_HOST_ENABLE 0x0130  CR_EVENT_HOST_CLEAR 0x0134
CR_USE_CODE_BASE0..15 0x0A0C+4i (DM [26:25]: 0 vertex/1 pixel/3 EDM; адрес [24:0], align 128)
CR_PDS_EXEC_BASE 0x0AB8 (align 1MB)  CR_EVENT_KICKER 0x0AC4 (align 16)  CR_EVENT_KICK 0x0AC8 (NOW bit0)
CR_BIF_CTRL 0x0C00 (FLUSH 1<<2, INVALDC 1<<3, CLEAR_FAULT 1<<4)
CR_BIF_INT_STAT 0x0C04  CR_BIF_FAULT 0x0C08
CR_BIF_BANK0 0x0C78  CR_BIF_BANK1 0x0C7C
CR_BIF_DIR_LIST_BASE1 0x0C38  CR_BIF_DIR_LIST_BASE0 0x0C84
CR_BIF_TWOD_REQ_BASE 0x0C88   CR_BIF_3D_REQ_BASE 0x0CAC
CR_2D_BLIT_STATUS 0x0E04 (BUSY 1<<24; COMPLETE [23:0])   CR_2D_SOCIF 0x0E18 (FREESPACE [7:0], EMPTY 0x80)
```

Биты событий (`_PSB_CE_*`): MASTER_INTERRUPT 1<<31, TA_DPM_FAULT 1<<28, TWOD_COMPLETE 1<<27,
DPM_OUT_OF_MEMORY_ZLS 1<<25, DPM_TA_MEM_FREE 1<<24, PIXELBE_END_RENDER 1<<18, SW_EVENT 1<<14,
TA_FINISHED 1<<13, TA_TERMINATE 1<<12, DPM_REACHED_MEM_THRESH 1<<3, DPM_OUT_OF_MEMORY_GBL 1<<2,
DPM_OUT_OF_MEMORY_MT 1<<1, DPM_3D_MEM_FREE 1<<0; EVENT2: BIF_REQUESTER_FAULT 1<<4.

### А.3 Формат 2D-команд (слейв-порт, заголовки блоков)

```
CLIP 0x0  PAT 0x1  CTRL 0x2  SRC_OFF 0x3  MASK_OFF 0x4  FENCE 0x7  BLIT 0x8
SRC_SURF 0x9  DST_SURF 0xA  PAT_SURF 0xB  SRC_PAL 0xC  PAT_PAL 0xD  MASK_SURF 0xE  FLUSH 0xF
Форматы поверхностей (поле FORMAT [18:15]): 1/2/4/8 pal, 8A, 4A, 332, 4444, 555, 1555,
565, 0888, 8888ARGB, 8888UYVY, …; адрес — [29:2] (align 4); stride [14:0].
BLIT: ROT [26:25] (0/90/180/270), COPYORDER [24:23], DSTCK/SRCCK, CLIP_ENABLE 1<<18,
ALPHA_ENABLE 1<<17, USE_PAT 1<<16, ROP3B [15:8], ROP3A [7:0]; DWORD0 fillcolor,
DWORD1 dst x/y start (x<<12|y), DWORD2 dst x/y size.
ROP3: SRCCOPY 0xCCCC  PATCOPY 0xF0F0  WHITENESS 0xFFFF  BLACKNESS 0x0000
```

### А.4 Ключевые константы

```
SGX база: MMIO+0x80000, размер 0x4000        SGX частота: 400 МГц
MSVDX база: MMIO+0x90000, размер 0x10000     PSB(старая) SGX: +0x40000, MSVDX: +0x50000
GATT база: 0x40000000, 256 МБ                GTT: 256 КБ (65536 PTE)
PSB_TT_PRIV0_LIMIT: 256 МБ                   PSB_MEM_TT_START: 0xE0000000 (видео-MMU)
PVR DDK: 1.7.17.862890 («sgxddk», суффикс bee)
```

---

## Приложение Б

### Б.1 Состав официального пакета Win7 1096 (`Graphics/`, размер оригиналов)

```
igdkmd32.sys 435200   igddim32.sys 1349632   igddim32.vp 18300
igdumd32.dll 1201664  igdogl32.dll 2419712   igddxva32.dll 817152  igdvidproc32.dll 74240  igdaux32.dll 25088
coppdev.cpa 1659303  coppdev.vp 1074  device_key_auth.vp 42920  device_key_copp.vp 42612  device_key_opm.vp 43549
igdlh.inf 58220  igdlh.cat  Gfxres.<locale>.resources ×24  igfxr*.lrc ×24 (локализации CUI)
GfxUI.exe 3158512  igfxcpl.cpl 119808  igfxcfg.exe 692736  igfxtray.exe 135168  hkcmd.exe 177136
igfxpers.exe 161280  igfxsrvc.exe/dll 261632/56832  gfxSrvc.dll 122368  IgfxExt.exe 179696
igfxdev.dll 224768  IGFXDEVLib.dll 4096  igfxdo.dll 130560  igfxexps.dll 23552  igfxpph.dll 200704
hccutils.dll 94720  igfxTMM.dll 260096  oemdspif.dll 59392  igdaux32.dll
igxpco32.dll 81920  igxpun.exe 952152  difx32.dll 319456
(корень пакета: Setup.exe, Setup.if2/Setup2.if2, DIFxAPI.dll, autorun.inf, mup.xml,
 Lang/, Intel Control Center/, ibxHDMI/ — Display Audio IntcDAud 6.14.0.3081)
```

### Б.2 WU-версия 8.14.8.1065 (CAB)

98 файлов, тот же набор (номера версий 2011 года), каталог `kit41165.cat`, INF `kit41165.inf`.

### Б.3 x64 бета 8.15.8.1050

```
VGA/Graphics: imgkmd64.sys 479232  igddim64.sys 1703936  imghal64.dll  imgogl64.dll
imgdxva64.dll  imgvidproc64.dll  igdaux64.dll  (+32-битные WOW64-копии img*32)
```

### Б.4 Linux-выпуск 1.0.3_bee (ключевое)

```
src/cedarview-kernel-v1.0.3_bee.patch  3.48 МБ → 224 файла:
  drv/   psb_drv.c/h, psb_reg.h, psb_intel_reg.h (373 регистра), psb_intel_display.c,
         psb_intel_dpll_cdv.c, psb_intel_lvds/hdmi/crt/dp/i2c/panel/opregion/bios,
         psb_gtt.c, psb_irq.c, psb_sgx.c, psb_pvr_glue.c, psb_powermgmt.c, psb_schedule.c …
  imgv/  psb_msvdx.c/h (56 КБ), psb_msvdxinit.c, psb_mmu.c, psb_buffer.c, psb_fence.c …
  pvr/   services4/srvkm/** (devices/sgx: sgxinit/kick/power/reset/mmu/pb;
         hwdefs: sgx545defs.h и др.; bridged/**; env/linux/**)
         system/unified/sysconfig.c/h — карта устройства
  bc_video/  bufferclass_video (V4L2-путь видеобуферов)
bin/cedarview-userspace: libsrv_um.so 1.7.862890, libusc.so (компилятор USSE),
  libglslcompiler.so, libpvr2d.so, libEGL/GLES*, libPVROGL_MESA.so, WSGL-плагины
bin/cedarview-vaapi: usr/lib/dri/pvr_drv_video.so (VAAPI 0.31-era)
  lib/firmware: msvdx_fw.bin 31844, msvdx_fw_mfld*.bin, topaz_fw.bin 327456, topazsc_fw.bin 352216
bin/cedarview-libwsbm: libwsbm 1.1.0 (менеджер буферов)
```

---

## Приложение В: ссылки

1. Intel Download Center (страница драйвера, EOL): `intel.com/content/www/us/en/download/19538/`
   — «Intel Graphics Media Accelerator 3600 Series for Windows 7 32-bit», `win7_1096.exe`, 17,1 МБ.
2. Прямая ссылка (снята с CDN, доступна в веб-архиве): `downloadmirror.intel.com/23473/a08/Win7_1096.exe`.
3. Microsoft Update Catalog: поиск «Graphics Media Accelerator 3600 Series» →
   `catalog.s.download.windowsupdate.com/msdownload/update/driver/drvs/2012/09/20464295_*.cab`.
4. archive.org item `intel-gma-drivers-win` — Win7 1096, x64 beta, EMGD 1.15.1, GMA500/600 и др.
5. archive.org item `PowerVR-Graphics-Media-Drivers-for-Linux-Intel-GMA3600-3650-GPU` —
   cdv-gfx-drivers 1.0.3_bee (исходники ядра + прошивки).
6. Ядро Linux, `drivers/gpu/drm/gma500/` — основная (упрощённая) версия того же драйвера,
   живая и в современных ядрах (gma500_gfx): файлы `psb_intel_reg.h`, `cdv_device.c` и т. д.
7. Imagination PowerVR SDK/документация SGX545: внутренние документы IMG (не публичны);
   формат USE-кода и CCB виден в `sgx_mkif_km.h`, `sgx545defs.h`.
8. EMGD 1.15.1 GC для Cedar Trail (`EMGD_CDV_1.15.1_GC_3278.exe`) — документация и CED.

*Отчёт составлен на основе: (а) статического анализа официального Windows-драйвера
8.0.4.1.1096 / 8.14.8.1065 / 8.15.8.1050 (INF, PE, строки), (б) GPL-исходников
Linux-версии того же DDK (cdv-gfx-drivers 1.0.3_bee, pvr 1.7.17.862890), (в) известных
материалов по семейству Cedar Trail. Смещения регистров приведены в точности так, как
они заданы в коде драйверов.*
