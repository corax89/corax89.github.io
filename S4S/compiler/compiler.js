const TARGET_STRING = "==MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM==";
const ico="/9j/4AAQSkZJRgABAQEAYABgAAD/4QCMRXhpZgAATU0AKgAAAAgABwEaAAUAAAABAAAAYgEbAAUAAAABAAAAagEoAAMAAAABAAIAAAExAAIAAAARAAAAclEQAAEAAAABAQAAAFERAAQAAAABAAAAAFESAAQAAAABAAAAAAAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC4xNgAA/9sAQwAEAwMEAwMEBAMEBQQEBQYKBwYGBgYNCQoICg8NEBAPDQ8OERMYFBESFxIODxUcFRcZGRsbGxAUHR8dGh8YGhsa/9sAQwEEBQUGBQYMBwcMGhEPERoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoa/8AAEQgBAAEAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+AY22OrHtTnbezN61HTgeKpgSwFlfIGcCrKXCn70WPwqrFKUbO3dUpvWzyorF3vsV7OnLdj3nYKNse2hLhypO3PaoTcswK7etOt3Kg4YL9aLO2xLhSXoRtA4G4jrUaozHAFWpmcpuDbvcCqyMwIxVxb6lScX8A8WshOAPxoS3d22ipvtUp+UL+lQpJJv+XOaepinIe9m8aliRxVarUkszIQ4IX6VNBHaeTmRsyFTxnoaly5dWCk0rshsrVbnzCxbCDooyTWifDxUqJLlFLEADHNZtu0ccuRI68cHpV0y2kzfvJGXYBjB6msantL+69PQbnboT/2JCrbGmLMMg9h04pk2j29qFae63AkDCj1pitYgsQ5yQR8xJqG5+y7NtopeQ4AyTWa9o3Zyf3CU7u1i6ukWsjFfMMahjySMkdqF0uwJYC4LFQe4HOKoIRFGqygqcMDkd+xpiyqi7fKKlse+arkqfzM3gry5ZKxGEtw2DI55/u1qqulsWZwBsJAAbggf41TkWCIjdCe3aoF2RzF3jIibO3iqknPqzeVDkdnJEk0UK3ayZT7O0n3VOSBWio02I77hkaQNkBAQMZ4GKzmkjxhIT067aezqrsDbl23Ak4zSlFysrspUF/MWVuLG3kzFGszsGO7BwDngYqaO9021O6Fcs4G4bTwe9ZpZzIpWLaqnpjGaat4iJt8rLAEZNS6V+/3k+yit5W+RrG602Bf3cW1mUgtsJxkUGayVGM1u0knlDaSvGAO1YrXIKsFXqoXmpribYUwow0OBgnABqlh9L6/ec1T3ZLk1C+vEnuDLGCQQu0N/BjtSC9U8yRhjk0qaf5i/K4BAGc9MkZp50ogczAfUfz9K7fq0rJW2KhWlTvysjN4oRFClisZTnocn+QqlWjHpyA7pJDtDhcEYJFVJolRFZW+Y5+X+tHsXTVzJNXIaKKKkoKcp4ptPQZHNJjQ+OTY+T0qwJLc8svzVDCE8zEgGMVOYbdSuXzk9KzbSMpK7IFlQTbioxmrLXNsA22P5sd6SSG2Ubt24+lQqsZds4Az+lQ7S1LjHmdiaC7iWMLKp4PQdDTZ7uN3UwxhVHtTXWFUwpzVeMJuG7pTjGLdypw5S19rQdE5qFLnY+doqwEtxzkGoYjCJPmHH6Vasc65ddB0t1vQqF60Lpl08aSJEWV+mOTU0xt/KbGN3bFSQ67cwW8cMQQKgwDjmok5pLkRdO1tis2k3gI/cOSV3YHPFSJod87AfZ2XnGTwBV+y1q+mZki8lWYcs3BrpodNultvLe6QSu+/cV/HA/KuOrialHSVjZK5xK6HfOMpbsV557VYg0DUEljdrcqARyxwK1tcuL22hjSGYzR7fnZUwFwa10tLq6hSR9QSONkUkbQSehqJYqpGKk2rP1GtHdHIFrhZHSS3MjK2MqOKlTRr6/jE6x7Ng4UnlvwrT1zQ3toDem82rJJtCkbR+lTaRZ3dxYR+Vf7V+Y5ABCgdvXNVLEfu1OLX4msq1Sa5ZMx7u3u9Ni8y6RVJcjZnkVCLO41CKNkCbnJKLk5I711D6fLclla4DFiMl8dCvXFVv7Il06zl8nVABEpYKFB/CojitErrm+YSrVJKzehkLpWoAsBCilup39KdJp94gIjMTZweuMnHQflV3RFmu7eSd70xuxKtvx+lBW3i2rFcPNNGAwLOME5x0+lN1ZqTj28g9tUXUzv7Lu9scQKbxljk9Px/Goz4dujktJFu9N3Oa1vsUbzsIdQkDMxbarCseXbFqHktdSGNXwTnt9a0hUnJuz/AzlKUtyO60r7JEzPJufeFGOnIokt3k+QSD5CE5TGT7VotHaSJJ9rudrMeVWTdwOlIbWwAUzTSgbQVy/NbQrySd7/cYyjJvR2KX2OSNtskq7wuVABycVLJZNED9rlXDsDgDPLVMF0tXWTzXLBsYLdvWooxZyF0feyrtLPuJ7849K0WIm9k/uM+SXWRG1n5wKh0RSSwwuTjpUX9nIzBVkOCFIYjjmtBV0h5FjTJPOCWIH0rO1L7LHeMtsP3agAbTxnvRGs6krNMPZzX2iV9LiGW84qo7Y56VEtrbsilWPzRk5Y4+bNTfarNmLsmXDDHHb6VnyiNpHIkABJxgHHWtFcyhzvdsgp6jIplOXpVs7ESJGHfaTipPsbE/KeKiRWL4U81ZMM6/cbIqGZSbT3KrREOVB6VJBbNMzKD8wpUgkaXaTgmrH2CVCWD4HrSlNLS47iLphK/e+amSae0LKJGHzVFI80TYLH86d5st1Im5uRwKSU76vQOl7k66cSfmbC0yGyDyFWcAfrVpbK4Y8SfL61Fb6dLJcEM+3Heqv5mHPv7w6fTFihZwxyKzK3brTJEt3ZpidvatDTvB6ahawOJ2jaSMytIR8gHp9azqV4UVebLovnW9zmrS1mupdsC7mXk56AV2BQyKv21ZJpcKU2ZIAxVm3+HeC7pq8ahV+YgY59K17fQVtyvlakbgl40+WMYCjI5ryq+OoTa5ZbeTFWpVZfCcbYWV4j3klxCyxtCwWNjgHNUxamzEkF9LskBXqxwF6kD3r0abwfdTRCR9UjXCsfLCjgemc1yeu6c7a5bW0+9tPaWOMzHGWOBnn6U6OMp1ptRfr8jrwzlSbdVLyMue5tpoY4p7kyxRMcLuPA7Yqsl1aRrtjBQGPJG4/e9K7u5+G2lzzNJa6iLe3C9CwY571HB8OtLiha4l1Hz4yCF6AZxxmmsxwiju/uO14mTekI/ccWbmym80yMwYMBHgkDbTY3spJBGc7cEsxY8V02p+B7Kzs7hbC4e/vBsKbSAOev1rG8O+G7fVZLyPULn7I1vxg46966Y4qhKm6ibsv623F9aldXhH7inK+nINkfG4DkZP+TVeaazRl8iMN8wznPSuw/4QjTQvkC+TzPMBMhcZC88D64FLc+FNGeHZDdCF4sKzbhlz6/8A6qzWPoXtr9w54mUtoRXyOQF1axfPEp83nkAimfarcJ8qEOV5OO9dA+gaWjCOGbzceYrO0gAyBxxTo/D2lW0m6S7E+FztLDGa0+tUt9SPrM+iX3HKzzRuG2jJJ446VeBYtGAq3GY1OD2H4/WjWLS2hmYw4T7vyg55xzTiI965m8rBCIVI5X1Nelh6sVG/c4q9R3TkIzyrFuaBF+Q5ORxmq1nHIyTFEG/AQDOOtWZY4thVrhpsqdo3D8KgstvkMPOMZY/Md2MY6cV0OvFtPU51NWuQNYsnDsAxbbxyOmaqEYOD2rYEcJKyNcOQwJySBz/jTRaWzjcMrHhTnOTnHNYTnD7I/aoyaKvzwWaw7oZCWz0zk/lU3kQDZ54WOEoMcYYnvUcyK9orXsZVOUcU2nLmmzUnhgMhJ3YxVoQ3CHLuAv1qlGZA37skMaHaYnaxJrJqTe5LSbLf2ObzDIGAGetIxm84r5mQKrGab7pZvpQoldiybiwpcr6jVk9di39gd2LSN1qNLNhOq7wM85oWG8ZCwD4FMSC5Mq4V956ZpxvfVl1JU3G0VY2I7O5zzLtQDioLSwmkuGLTbeveo1Gos+wbyRUFvDeSXBEAfzB1q0meek7P3kbN9YTJZuWnLY7Vz4u7hE8tJpFjHRQxx+Vadzb6oIGNxu8odeayQjEnAJ/Cmoq2uppQTtvf0NLSbxBdj7e1xLG3GEc9fcd69Wvm8OxQ25vbW53tCmwRoyj9PWvKdG1ebRbkzQxJICMOHXPH17V3qfFxokjWPSo9iKqgscnj3xXhZjhq9WpF0otpdpWOyLS3Ni2OnyW7F7eWGH97jbCw3Jj1PpToI/Cuo3CQfY7qQnbsaRWIHP8Ah3rm4vibySdMaVULkAylsK3XPFO1L4s3l6IvsdmLUJIruVbO4A/dJ9Oa8z6hjHKyi1/28UpRMzxOtjaapdSW2m3X2ES7EcOyqT7V0vh3VtHtvD67tLu383cHIjL+vRvpWT4l+JI1nQ7SztLfybhZC8rsox34H51N4S8bTKsazWsTNaQuGmbO3YeuV6Z9666mHxFXCJTpu6f83br8zSjB1aihDVs07+3sdTsZodHsptLtzJHifyG3Z/E1zehWdvo9vdy6/ZzqskoEc725YOoPIHoT611v/CcX1zcZt7S2lMawGKPkDnoaz/EWtaxrunLDHHBa/vSzuJCeBkd+3JrKhSxaXspRtF2u+bVHb/Z2KesYN+haih8OGwW/g0ltjSfukEZZmweuPSo5fsNyzHUdKmedo0Kr5fAUjj6c1T0rX9W0PSY1aG2KpE8iyNISzfh2qCDxReta3VxdW0DSCKMDD7txJ+Unnil9SxK5pJNpPfm+45MRTnhUvbLluQxNaohGqaPIpildQscBK9f8iqNxe6PE7QtpckdxvUJGYvmIzxXQWmvam6y3eorCltERujiO7IznrnrzXH+J9auB4illh/diFl2qec4AxmuujRqyqOMlbrpLQ441qc7qDvYvypao0hubGe7csefJ+7noMg1WYWRLf8SiUNkYHlVVXxlcxI6W1tBCGJORnqetacl1qLJmKaFs4JyMYG0f412UsHiZ3tH8SnJLcz42jIT7Rpsm4BsBY+OtJILdF3Cx2kAELsB3ZHFSjUrq2hlkuikhKBkC5+lZtvqFwRLJ8gkRAc4zkD8fet/qlfms42+YcyLXnxmJfPsGZthwAmQOefpVk3HyxgQvbruUAFQOmTjH04rFGv3I3fKnI646UyfWJriNQ6ruDBsj6f8A16j6vJvVaeo29NAJZbrzlswY9+4cHpmtRbuGIyF4ZbqST59r4OwdenasOTUJpIvLbG3GOKcmoyoSQqbiME45NdUqKluY3q22RTpynFNpynit2aj1kKuGFTrebRygqGNwsgJ6VaX7M3Ldahmc7X1RV875y2OtT216beUuFDZ7GvSvBf7PXxI+IYS58MeD9QmsJACl3cBbWBh6rJKVVh/uk161pP7BnxMn+a9m8OWIYcrNqDsV/wC+I2H5Gpk42sw32R82R66V6xcU+/1tJZIWt14X73GOa+mrz9hj4jWEDi1XQdS9Ft9Q2s308xEH615N4w+Cfi/4d3CN4p8I6np8AODcGDzYCf8Arqm5D+dYRjS5rpGb5ndcrOCHiIAbVgxiq1vrksNwX2jac8Ac1vKulRuzFkZz19qo6fLpcd6+5Qc5GW6V1K3Y4k4WfuMbd+JPtFu0YhKlhjNXrTXNOSKJS32eQqGlYJnkYyPxAqbU5NLayk8ry938O0c5riT1NL2cZrserleOlg+aVKO/c6vXNSsdTtDHpbNG4ILRiL/WDjv7VFPc2X2DS1Nqbry4iskQJUh89Tik8HeILTQLq4e/heRJowoePG5ee2fWu3vPizphmtP7O0dIIVcefmNSzLjsfWvMr1MRSqKnSpOSXW9uh0Y2u8wqKrU0fkeeyXEEOn3C28BimuZAGj5JRB2yfU10TGwawWX7P5NqCglVoyMccA/jzXSXXxV0RLFo7HSC90FYCaaNDlj3NEXxZ0iZgdQ0t5Iz5bvFtXaWUY/LvXFUrYypH/d2te+plhnHC1VUi7vz21OUh/4RgxEzbDIq5bCsATnnA/lVqJNPktZpNDtmFr8gmZkZl685/Ck8U/EC11O6RtE0m1tYQCWEkAJJroNE+Lmm6do8FnPpGXXaZVUAIxB7ClVjjFSU405NvpzLQ9tZvpaNOC81HU85v5Lq1uJrjT1uoLF32Ru4IGB0GaHu9ansFkY3LWgYjzNp2kn3r0LWfGFj45jNidPvIrXzd0flIFUNtwAT9an0HWbfSbOxi1GzkuJLGN4vKjlHlvwW3EEferqWMrxopuj7y6X6evfucdOOMrKUqTfL5XseVC+1DCKJpiFUqo68elIRf2AkjkSWETINyspG5e1e4ab43sbiSaa90P7HHHGDCBACSSc4+hyKyn8YrNeosmjPEskqC5eZFI8sKRtFQswxUm4vD2t5ozlhcTUS5lJ/Jnk1ompKn+hx3Hlt83yqSpxz+lRJb3uq3beXHJcXEhLHAyT716jP40eWVlfR7kQCSVYkiACshGBn3GKWD4g2lwZFtNJ+zeVFtY/KDnoB79ap4zFpc3sPxRh9UnGVnFpvyPJ57O4tpzDPC8cq9VK81vfabZ/L+1ObfEa5KAqd/Qj8BitLXdVnvbw+Xp8qRoqpvb7xO7PJ9Oa5y7hmnzGkEjbZnO7HBz2r1sLjJpJyilfzNpYL93d35u1izI2nGP5ZpGbyyMM5H4VQtDbiCQTs6gsvc81aW83rNm2GUGCOMjtiopUlnSRTCYs7cZOOa3eLbldxSG8FG3uTv8mRSm1Hyxbdoc56njHrWeR6Zx2q3G+1kiaMs6kjAxyaljkcuP3BwCcDtUzrOXQyhQi/tfgUAjEZCnHWm9OtXBMZSxC42I3H1qG5JLKpXbgYyepqVJt2JlTio3TIactCoWHFPETDqDVMwNHQNCv/ABLrdjo+h2cuoalfTLDbW8Iy0jscAD/HoOtfpV8Bv2RvDHwwtLXV/GFrbeJPGBAdmmUS21i3XbEh4Zh/z0YZyPlC9/Pv2DfhHBYaHffEnVrcNqF7JJY6OXGfKgXiaVfdmzHnqAjj+KvtGuOrUafKjSMbu7HlmY5Zix96WuH+IPxU8N/DS3jbxDcSS3067oLC2AaZ1/vHJARc9yeecA4r588SftujSH/0fwrbqp+5HLdvLKw9flCgfjWcaE5q6R61LL8TUouvy2h3bSX47/I+u6V1WWJ4pkWSFxh43UMrD0IPBr4+8J/t86Lf36W3jLwdfaTasQPttjcC4C+7RMAcfRifavq/w/4g0rxVo9prHhu/g1TS7xd0FzA2VYdwR1BB4KnBB4IqJU5U9WcCkr2TPBPjX+yr4V8Y2lzq3h/SY7bUFUvLBbDYzDu0ZHcf3DkemOh+DfE/whuvDN9ulnNxpkhxHOFwQf7rDsf5/pX7AqSrAjjFfL/7QHgWzstYeYQL/ZeuRu7RjgJKMeYB6ckMPc+1aU6son0uAw9LPIywVX3atm4T63X2Zd/Xddz8/wC+8IR21tJNHMSyDPNci33j9a7LxbpesaFqV9ptzK0sEEhCv/fQ8qfxBFcaepr0YXau2fEewrYacqVf4ouz8rGt4f0JteuzCtxFbhRklzyR7DvXZn4VS3zSf2XJLAkJ2u90AA59V9q85hEhkBtw5ccjZnNajazrjD5ry9wBj7zdK4sRTxMp3pVFH1RE1Nu8Wdz/AMKeleOFYdSiMwDtMT90AdMV2fgj4YaT4PgXxx4rWLVNPtSIdK0+dAU1DUCMgMv8UMQw79idq/xGuW+EHh278ca/Jp+papqOn2sUT3d7eZIitbVBmSVz6AcAdyQOprofFvi5PFniSxt9JgksfDekxCz0ezc5McAPLv6ySHLu3cnHQCuCLxdNy9pUuku1hU4zVSPNK67H0p4R8aa7f6Wsl1fF2POBCigewAXAHsK6AeI9Uzxc/wDkNP8ACuF8Ert0mP6CunFfj2Ix2KVaVqst+7P3PB4LDPDxbpx27I+fv2iPCsun/E2SbwotvpsN5bWl3cWsaiOETSQIzuqAYGWJJ9zXh+oG+0GO3ka6juJZJJCRgnk8Hmvor9p/T21Dxcq2E3laiNP08Rfvtgx9mQk15D4X0HR9e0aGDX7+OGYzyG4lkm+dGB4Cjpz61+wLGU6FJTqK9rXstdr3Pz3E4nDYa9KjFxnZa30vZO9jIibV3uMRyW2U2NPhSMnGcZ78Ct/Q/h94r+JmrTw+EooZYLCUSXM8pENtZpjJkmlb5VA568nnANdd4R+Eui+LtQntLbxTcW+m6fC1xql6z5S2tV+82O/YAd2IHepvGfjez1jTI/Cvg9X0DwTYvmCxRx5l04/5eLlh/rJWwDzwvAXpk1SxlOqueKfzVjPFZyvYOnFS17v+v+Cy7b6H8NvAuf7f1rUfiLrEa4kt9GxY6crc5X7Q4aSQc/eRVBqlB8UtG012j8LfC7wPp9uxzm+s5dSm46ZeaQg/981wawWoDRpIecgsx5HpVi10BLm4VLJ5rqQ9FiXcfyFX7aKvf8jwq2YVa/LzSbt5ncN8Y7mYN9r8B/D64ib+FvDkcefxjKt+tI/iH4WeJ/8ARPE/gi98KTuTnUPDOoM6qx7m2uCy7cnna4OOlcLruh32mx+bd2N5Zx7yoMsTKGHryKqNaxzN80gRQo2vuyWrWPLKKk0ZTzGpSsoylf1NbxN8AdW0nSrrxF8NtYtPH3hmEbrqexiZLuyUc5uLRvnQdfmG5eCcgV5HdzXD3JV2BCOvzAcZ7V6/4b1jUfBms2uteHdXudO1CA5imifBPsR0ZT3BBB712PjTwVoHxh0DUfGPhK0g0fxbpyC48R6XbDEUsIxm9t0/hAP+sQdM7vXLdaN+Zr8DSljVKPs02j5sK4cMNgkEpGeeTUMl5MG2vjKsciuoXQ7OBWaS8MxZjjoOScfnWLq2n29uN0X7v5wME5zxk/lTp1qc5WOidZ29x2MlJNm7AHzDH0okkaQjPQcAdhV1bSAwRsZAM9WJ/TFR3VvEitJE3y7yqj1967tLnCq1/dIInK9Kk89mNVwcdKVeaGVa5+ynwZ0iHQPhH4E0+3ACxaFaO+OhkkiWRz+LOx/Gu4MyQRyTT58qJGkfHXaoyf0FcF8FNbi8Q/B/wJqMDB1k0K0jcjp5kcYjkH4OjD8K70BD8sq742BV19VPBH5V5cvj1N1pa5+cvjnxHe+ItY1jxHrTNJPO0lw4zkKoHCD2VQAPYV833GvzXlzLc3I3SSMSfb2HtX2l8Ufhbc+HrrU9HuYyLS7ilS0ucfLLEwIDZ9RnkdjXxT/wj95Bf3Wn3wMFxbsUdD/eFelGtzLtY+94ylD6vhpUXei1pba+n6fqWH1V4Y1Zo+DX1P8AsOfFe4tfiDceCLiR203XbeWaCIniO6iQvuHpmNHB9cL6V8tp4cuZoSJpfmH3Vrd+HGt6z8LvHujeJ9Fjs5tR053eKO6VmibcjIQwVlOMOehFHMpxcWz8xjVpJ3TP2OB4rzH4+2K3XgD7Vgb7G9ikB/2WDIR+ZX8q+Uv+G1PibMzD+yPDduvZorWQD8nkauW1/wDao+JXjawudG1NdMj0+YqZFS2Rd21gw5Az1APWuWNBrW59DlmY4XCYuliJVUlFpve9uvTscb8aZ4rF7SYpue7iaLOO6EH/ANn/AErwlvvH616Z45u9Z8S2cLal9lVLMsy+UpBOQM5yfavM24JrupK0bGWdYzB5hmVbE4R3jJp9tbK/4nU+BPFNt4V1Ce4vbT7Ukke0YxlTn3rtW+LEGo3UVtb6MZFlmRUijiUsw6bAB1JNcD4S8LSeKbi4ijmEIgj3k7dxPOMAV7l4T+HkPwg09fHWpzx3muS74fDFs6DC3A4e8YHqsOfl9ZCP7prw8VQy6timqus7ef8Awx5alKMb9Df+KXi+18IaNH4F0m3ih1Sby5/ErxBfllHzR2W4cERZy+Mgvx/BXA+BtBu/GPizT9MslWFn3ST3D/6q2gQbpJXPZVUEn8hyRXNzaVcXE7ySzGe6lkLOzMSWY8kk9SSa9yk0pvhd4Ol0FFQ+KtXijl1yT/n2hyGis89udrye+1f4aqFHDU6fLHSKX4HRl2Glj8T7zslq30SW7/y7s9Y0jWtM1vw/droNnFb6dpV+lnZt5QWaSLyiS8rAZZmK7sH7ucDilFcF8EdSur3wR4kjv3ilktfEEcQeNcAjyDXedq/KuIYxWPlyqysvyP2LJ60MRhPaU1aN3ZeS/Xq/M89+Ok9gnjyK3uNLkvryawsBE6x5Cj7JH1P1ryD/AISHwzqEt1aaZoAm1C3EjuGjBwQeuelepftF65eaD4nnu4Ege3i07TWIckMX+zR4AxXkGieGtS+3WeteGrC3mFzZM91HK5CncSeT619lVpU05VKjtore9ZXsnZ9j8rzB/wC1NLtH/wBJR3esQ2vg74XaZZWVq9rdeNJ21nU49u1xaROYrWEgfwlllkx6lfSvMxcQnMdrZvGzDBYpXq/xr1K6j8S+FoJo4lSPwnprfLyo/dkuF9t5evN757yWaGQRLGgxgE43fWvV5ndKXZdfL8Tw6vxPyO9g0vw14C8Iaf4m8aaOdf1zV4nuNE0Elo42iBIFxcsvzbCQdqAjdgnOKzbT9oXxrqFn/Z8F3deFrVnXZZ+HbJdPjiGeimMBsH1Zifeu7+L9xq6+LLK+0LSYr3Q77R7CTTZDKFVYPs8a7QO21kcEeoNeRf8ACX63Za1Npd7o6zTSToEZX+SMcYGcdK5ZYmr79KnFaa/EkzpjBRtqdLN+0Z418OTrEvibxGwACH7fcvdKxJ6FZdynj2q6fH/gbx/qMelfE7QLbw3qlwAIvEmkWggMbno1zbrhJEPdlCsB0rzbxX4f1DxPm602389kkVV2TfIAoweDjP1rYFxqw+SfRAg8vDStIrFeB046cU6eJVKEZRd3rdOX+Y3Dm0ZX8ZeEbrwZ4kutC16NPtVphg8bb4pomG5JY2/iRlIIPv68V0fwftPGNl4t0nXPA3hnVNaW1mImW3snkhmhb5ZInfG3ayFlOT3rUi+NHizTdK0myHhHQr/UtLt/s1nrN5Ypc3MduHZkjHmEoAu8hflzjFcn4t+Lfj/xYskXiG61a+g3L+4NyRCvA4EakIPwFeisVFqy1+aOdYZJ3uc98cPBejfD34q+INBsCGs4Z/NtNsm7ZFIodEbBPzKG2nvlTXCNsS1ie4jLxqhyGU53bv5YroZrl44kZtKKymQjaFXdnHWqF3NM6q5tnDkuBD1JJA6/lW/t3Utp+JpGmoNtMy8aRuDqPMkaT7ozjH0poj03aqXhCsm7CqSO/FV7NJ7e6RZbYoZFZQQMEe9XlniSERxWb3LDIEpUPk49a2kuV2Tb+ZoczTlz2ptOU8cV6TJR98fsG/FmG70i++GusThb20eS+0bc3+sibmaJfdW/eAdSGc/w19pg1+JPh3XdQ8M65Y6vot3LYajZTLNb3ERw0bqcgiv0f+CH7YXhbx/aWul+P7u18M+KAAhmlYR2d4395XPETHurceh5wOOrTbd0UppOzPo/UNPs9Ws3s9VtIb61fkxTIGXPqPQ+4wa8M+Iv7JXg7xwxutLurvw/qQXCSp++XHYHPzY+pb2r3zHyq3VXAZWHIYHoQe4oBxXMpOJ2QxNWFN0lL3XunqvuenzPzi8dfsh/FTwf5l1oEEXi+yjOQ2muDLt94WIcn2UNXzxrNpr2may0Wr6fd6dfxnDW9zC0TqfdWAIr9pgfSszxB4a0XxdZ/Y/FOlWesW+CAt1EHK/7rdVP0IrphWS3Rw+wpuV7W/r1PxvOtawG8sxkle2Kz4NV1BLovGXaT+7iv0G+KX7JekQ29xq3gmOWOFAWlt1+aSIeoXo6j2wR79a+O/Efh298Bajv1SzjksZSRHeRLlWPof7p9j+Ga6IVYy0SNK+U16WHeJpQVSn1cen+Jbr8uzOMu9f1Se3aOeMqjcE7a51/vH613up+IdNuLGVIgCzjgbe9cZpul3muata6bpNvJeX15OsFvBGMtJIxwqgepJreD8rHl4fWL93lO3+D3hCbxR4innu76fSfDmkwfbNbv4jhorYEDYnrJIxCIvdm9Aa6Dx/44vvG3iOTUJIjp9lDGttp1ijEpaWqcRxD1wOSe7Fj3re8U3Fn4H0i1+HfhmVLqKxl+0eIL6A5F/qOCpCt3ihBKJ2J3t/EKd4A8Jv4z16CwlUWmnRRNdajfuNy2tqn35D6nkBR3ZlHeuCtUtU0je5rJSqtQhubPwj0SPQbCX4h+JVV4LORotDtp/u3N4oyZmB6xQ5DHsX2js1eQ+L/AIk6zq3iG6vra6nWGVmw0nJmy2WkbPUsea9q8c+M7bV9Zg0vTdImTR7WBbXT7NVzHBAM7VY9Czcux7sxrk9Q1XRIGaDUfD7yzRAR58rKg56CuCvjo0qnsVS5++x9Di2stoLA0/idnUfn0j6R6936Hon7M9xJd/DTxHPcMXlk8QxszHufs5r1sciuU+Ec2nyfD7VE0uxWwVNZj3oAOT5B5rq16V+W8QVfbY91FG10tPkfo/DcZRy2KkrO7/M+e/2vdWvLL4gQWdtOyW11otj5sfZv9Hjrwux8c+IdOtEs7HUp47dRtVB0x6V9MftLzaDD8QoH8Q2UlwF0uwxIsZYKv2aPgn615M9zpM1nDfafp3kaepliglMP8RHB96/Ufb0Y0ownR5tFvazdvzPyrMKsvr/JZpPl17e6jqtVv7jx38HPCviyCQzar4Yd9A1r+8sTO01pKR/dIeSPJ/iQDvXnD6hcy7fMlZtpyK7r4cePrLwrqV5JcaZNq2kX1l9k1qw8pliubcnkD+66nDK3VWH1rU+IfwsOhWP/AAkXg+Q6/wCCbh18q+iXMtoTz5F0g/1UgyBk/K3BB5wN6VWnUduSzHjsvjQleFVSTXT9exJ8P/jJDpGkJ4Z8fafNrnhuORpLSW3kCXumu33mgZvlZT1MbfKTzwetLWfg/deM9XbWfhN490nxPdSOHTTLyYaXqKt2URSkRyY6ZRzn0rz/ABbjJVGzkYzmmXO1iq7CWL5AA7VoqdJVOdQV2rbdDid6UUnNMueLLf4peBnaDxjouraHGWxvuLAxxsf9mTG1vwJpZJNUeUNZ6uGZFbcHXOAAPz611nhv4v8AjLweDBonibUbe1Hym0eXzoAvcGGTcn6Vtz/EXwV4sKr8R/h/pc80mQ2qaATpV17uypmKQ/VBVQpYXla9kvuNq1CcopwqpHmE3iHUtIgup7u7W+mwjBPLwFyOv6Cud/4SDVjYC4gmLSXErAp5f3cAdDXsmpfA/Q/F1rcal8Fdel8TNDEGl0C7At9UjReSQmdlwAOpjOe22vEb6C3QyxSyzwtCxBgYlTGQcEbex9q0p0MHFv8Ad7+R0UsFVcL+1i/nYkm1XUIlbZMshWJHO9OxX1rKHiO9EjOxRmJzyvtTLoqyz7nwgI8vD5zxWYe9bulh5awhYxnTlSdm7mjLrlzM0bPs+Qk9OuetSR6/PCixwxRIinIABrJopexptWsZ3CnKM02pbeGW5mjhto3lmkYIiIpZmYnAAA6kmtWCHxQh5QjNjNWf7LkY/uvmWunsvhF8Q7+RfsPgbxPcMRkeVo1w3Hrwlal78GfihounPqGp+CvEFhYx43TXWnyQquTgZ3AY5IFTfzIcak5qNPd9C58Pfjp8SfhY62vhDxLdJp8Zz/Z9zi4tcdwInyFz6rtPvX1P8Pf28vtpW2+JHhLynGN95okuR/34lP8AKT8K+INR0LXNFjF1qVlNaxu4QM4HLEE4/Q1X0+9vI5Xkt13sBzxSnFSWo61PE0HyzVn2asfsD4I+Lvgj4h7E8J+IbW5vHGfsUxMFz7jynwWx6rke9dvyDyCCOxr8XodZ1RNtwkDKYyGDDggjoRX3D+yB+0brHjfUJPAfjuSS71BLdp9Jv5iTLKqDLwOx5YhcsrHnCsCTxXHKlpeLFSqzbtNH2GrFGDKcEdDXzL8fvhrYW8zXS2iNoes7lmhx8sU3UgemfvD0IOOgr6YFcf8AFbTU1T4ea4rqC9tELuM/3WjIJP8A3zuH41lHV2PrMhxrwePgnrCfuyXRp6fgfkt4r8DXXhnVru1aTzIYm3QueN8Z+6fr2PuDXongnT/+FV+ER4sul2eMPEUEkWgRnhrGybKS3vqHf5o4zxxvf+7Xd674bs/FXjzwBYakpbT9S1y30+9CHDPE7g7c9uAw/GtXxL4MvPFGt3WqakqmWZgqIi7UhjUbUjRf4UVQFA7AVjjM1p4CEfbP4tvkVm2QTpZjVw+GXuxs/v1R8/2kdxNcxQ2UcktxK4jjRFLM7E4CgdyT2r2vx3rVv8HfA6eFYXSfW53SXW5I2H726HK2wI6xw5OfVyfQV1vw38G2fhbxINUvo5Umit3WzuIoFma1nOAJgjMoYqN2MngkNzjFZ/ir9nXw74t1Nr668ca3CuMRxnQon2+vP2rkk5JNctDPMtqe/Ook/PcjAZRicvU66g5VFpFW2b3l206eevQ8e8PeOPEXiKG4OmadbNFDtXLPg7uwHvWzcv4m1iJLTU9NgsdjGTf5o5xz0716Fon7Oen+HPM/sX4kajAJCCRJ4ZRuR3/4+utWp/gM895Hdt8T7h5kBUb/AA3gYPqBcGvCq1cC6znQqU0ujbdzzZ5TmE9Z0pNmn8FbW8t/AOvNfWzW4k15GiLfxr5B5H41244FVvDWht4U8MSaRceID4inmvRcecLD7KsSLHtC4LsWJJJzxjAq3nFfFZxVjWxblFp6LbbY/UMkhXhgkq6ald7nkH7VWuTaZrVxB9iWa3udNsFMpIyrfZYwB+leUeG9W17wxpdms/h2W+tLBGkd+CuGG4HHsK+nviR4As/iLrdpqX9vaba2otbZJrO+sp3YSRRCPhkBBHGa4nxz8PNZ8OeFb3XdF1fStdsNGtmN7aW6zQyrE6iIOBIgDgEjODkZ6V937ejiVGjSUZ82vxavS21733PznMMFifbyqckrKyvZ9kvzPOI9S1vXbWTUIrFI9NvLNmSK3lXzPlO44Xv1AxU/hL41XPgW5v7zQ9K1O0nLBdQLQho2TGCkqH5WX2Yd64Dwb49e1t9P0i1tpTcpb3ECSK4GGkOQ34Yr1T+0LrV9E1aGxs/JaaN2Fw8auJh5e08ZyMlTg1hXpPA1eWpTsr6NSa0va/W+h4qtLW5b0Lxp8PfixfXSan4P1DwneIc/2p4f2PaHPQyWsrDZ9I359BVyT4JX2qxyzfDzXdC8YoH2CGO4+xXgI6gwT7efYM1eS+EPCV8/hrVNI16G60mGSeO5FymM4H8JGfeucn1S10Cx8S6Sbi6adr2LyfO++yo2Tur2lUVatKnSs+Vra7utNbp26mLpwavJHd+IvDWveFLn7N4n8M6jo05Zsfa7RoxJx/CxGG+oJrn7eVZlVGs2mDJtjCjPI68V3enftCav4TtrqbSfF1xf2N+9uo0i8T7VBCg4kBilDIAR6AGugtPF3wv8f3kVlqCaZ4F8RXTOlnf6azjS5Wb7q3EJybfPA3odoJyRiumlWnGPuU2m+9zlq4OFTRs8tsL240+/iutLtbm1uLaQMs0IKyRMOQQw5BHrXomvQ2Px38OatqkdisPxH0a3+0XwiiCf27aR8u+0f8vEY5OOXUHqRxxXiTTLrwX4t17RdUWezurVWikilYkiTAwQe4IIII6ggip/AvjRvBup2GsaVKY9Q06RbhN3AdwclSe4YZUj0Jrshi61K1RR7fjvcxo0Y0pWUjyC5urYsyRQGGKOUkr5fYqBjn1IrEmQq7fI0YPIVuoFe+fHzSdF8PfEDVpfD4hhsdV+x6pYRt8qm3nRZkwPQbyv/Aa8o1Wa0N9ay3TtLkkmMSBghz6+ntXU8dOs0pQsejyJdTlsUldFaS6ebi+dlItyVwGwcnd/KqUluZLu9a8w3lxlgV4H+ziqVa7aaCxlV1Hw31dfD/xC8JavKwWPT9Zs7p2PQCOZGJ/SuXpy1uwR+5krv5rqztwxHWuT+Jmjya/8PvEWnwKXla1EyKOrGJ1kwPfCGud+AnxFi+KPwn8Oa8JRJfrbrZ6muclLuIBXz6bhtkHs4r0tJCjBl4I5rzNYyOvD1pYetCtHeLT+53PzK+K2kSP4TuJ44zJ9kkSYgDt90n8AxNeC6brK2Vy8hi3Kwxiv07+JHwJOpSXV74Rhint7kN9o0yQhSN33hGTwynn5TyOgzXxV4u/Z58SeE9Umks9B1GexfJETWr+bF7YI+YehHP8AOuiMozi4zPr+Jo0s3ccywT5nypSj9pW8t7enY86tPF9sXVZbfbH/ABHHFez/ALK80niD9ojwydHixa2Ed1c3DqP9XEIHUk/VnVf+BVzfhD4A+OPGcwttH8G6pFCxw1ze2rWsK+pMkgUcegyfavuz4BfAHSfgjo9wweK/8Saiqi/vUXCKgORDFnnYDyScFiASBgAYqjRpPnitT88puVSWsbWPZK534g3CWvgDxVLKcKNJuV/Foyo/UiuizXjP7S/i2PQvAceixSD7brkyrtB5WCMhmb8WCD359KKUeaaR9FllGWJxtKnHrJfctWfKumanEnxF+GqTSBM+LLA5Y4HDkfzIH417GR5bsrrtdSQyngg+mK+RviBs1Dy8Ssj2QLqVbGHOP5YH51lwftEfFO1URx+OtadUAUebc+YcD3bJNeZnOR/2tyKNTl5b9L72812Pqsw4kp4fN8Ryw5l7sd7axWvfq/wPs7cKN1fHS/tLfFZP+ZyvW/34YW/mlTp+1D8Vl/5mrdj+/plo384q+a/1JqdKy+7/AIJC4vh1ov7/APgH17kUuRXzP4Z/a18bWn2keJb+11LeB5J/sWxBU/hCM1vR/teas24Tw6c2HBBbQ7Q5XuOI68+rwpiqcnFNvzS0/M1XF1HrSf3/APAPes+lFYngH4hx/E/wbdaw9taw3Fnqn2UNb2iW4ZGi34KoADj1xnk1t18vjcJPA1nRnuj6zAY2GPw6rwVkxDiovEAB+GnxEH/UCb/0fFWV8TfirF8NNYk0/wDsvTZrOGzs3VpbIyOWkgR3ZmB5+Zj9K8w1n9pqz13SbzSfK07TrO9UJcG2tGRpVByFYsTxuCnAxnFfT4DKMRg8TGvbm5ddE+21/mfL5jxBQcJUOV307eT/ACOVl+Hnw0+HN3oj+Jde8YahqtxptnqYGmabaxQbZ4VlVQ8kpY4D4J29jXX6B4++F7alpemjQ/Fs1pPcxwSXF5rNvCIkdgpYiODkKCTjcPrUXxMm0nxn4B8JeONGCXMNhF/wj+pCNeIZIsvbkj0aNtuemY8V4408DKyyRBUH3RjFfoMlTxaU6tO78z8snOcJNR2Nr4ieMde8IfEDxT4YvIfOh07Up7REcHe0SSEIc+6hTnvmvINTv5tU1C4vLrHnTOWbH8q+rIrXS/jfbW95aXltp/xOitIbO4iuZFiTW4Y8BHjlbhbnYAhViA+FII5Fee+KND8P+FtTOmeK/Dl1ot+Gw6X1u8LY5+YZHI6cjINZxqUcDP8AdUHr/KdWs1e54SR60mK9R1P/AIRzULlHREa3jiWKPy1ON3p9a9E8I/BjT7WC38U/Eu3PhDwlE7Nuu1KXeoADiO1hb5nLZHzkbQDnPFerSxPtYKTi15HFOu4TcFBvz6FP4pzS3/hn4ValqfOsXfhGEXLN9+SOOeaOF29SY0UZPUKK80Fd74+8Y2Hj3xNNqzQpYWqRJaafYxt8lpaxLtiiX6KB9SSe9YuheHLjxb4g0vQ9FjEmoajPHbwqOm5jjJ9h1J7AGlzW6HOpqtN2LP7SH+v+GBf/AFx8Baf5n/f242f+ObPwxXiJr2X9oDW9J8VfE29TQ7lW0TRUh0Wyk3D5oLWNYQw9QzKzA+jV5gbKyVwPOZufUetaxlZJHZ7WMdDIpwdgpUMdp6j1q00EZ6AqC7AHPb1qowwSAc471aakdTi0k+4lOU4FNpynFNko92/Zk+Ps/wAFfF0keqiW58JauUj1OBPmaEj7twg/vLk5H8SkjqFx+omk6tp/iDSrPVtCvYdR0u9jEttcwNuSRT3B/Qg8g8GvxJjk2SBq9W+E/wC0D4u+D1yzeFtQ8zTpW3XGmXamW1mPqUyCrf7SlTwOccVz1KfNqhOTi9j9bRUolkT7sjAezYr5L8Gft8eBdXSOLxro2q+Gro4DS24F7be5yNsg+m1vrXrNj+078H9RiElt8QNKVT2uI54G/wC+XjBrmdOa6GqaPWjIzffZm+pzSZryPUf2ofg7pcRkufH2nSgfw2sM9wx/BENeX+K/28fA+nq8PgnTL/W7o8JPeR/Z4FPrtzuYe3y0KlOXQ0iubrb1Z9M+JPEul+DtFuNZ8RXItbGAY/25X7RoP4mPp+JwBX53/G34xzeIdcvNc1LaLqZfL0+xDZEEIztX6DJJPck/hzPj749eIviNqS3muXysqZWJBgRwL6RoPlX68k45Jry6KbT7vU5JLyR7iV85eRs5P1rtoqNNNrVnsQzShktOX1dc9WS+K3uxT7dW/OyMKfVby8d2uLh5DIxZsnqTVNup+tdvqFppYsJWjEYcD5SDzmuHb71bxfMfK0qvtrysdf4B8HweL7u7hubhrcQRhgVx1Jx3ruz8GdNjimUan5srqBEdwAU8ZJ/OvHrTULqxEotJnh81dr7TjIpRqN4Ol1OP+2hrycThMdVquVKvyx00sdKcUtUejav8LbPRtQjtpNX+0b1LAImCcDJFYF54PWaRv7IlUpGQsnmPzk1f+H6aZql1cTeJdUkhmgwYd8xGfXrXo0+leCdZK29vqkenKGLO8UgUufrXmyzCrgKnsq7lO27UdPwPTwlTCxhKNane772Z6H+zdZCw+GeuweYJSviFQSBgZ+zivU8ZFea/DTxF4H8E+FNS0vVPFC2XnX6Xi3VykkyMdnllT5SsyngEHGOvSvQode8I3MUctr420OSKRd6ti5GR68xV8JndCvj8Y8TRg+V2301S8z77JsywGHwipymo6vTyueO/tRy6g/iqWy09FkW703T1ZT1/49o/8K+XTo14upf2e0Y+1Zxt3DHT1r6s+MyaV468bPeaH4iEFvBb21tE2zBmEcSrvweRkrwD2NebTfDm1vz5+n6gYb1ZGzPIACw4GMfjX3lDNsJho8t9dLuz3tb+rHx2Olga84yinf3b9mktbeZP8JfG8fgu3k8PeJ9LfVvCuuxG21iK2cFlTflJ0zx5sbfMv4jvTviN8NtS8HX8DJKmqaFqAM2l6tbg+Rdw9iD/AAuOjIeVP4E8rrvh6/8ABiWsdrq9tKrqy4kAA69q9I8A6x4w8Lab9lvZdL8S+Fb/AGvfaJqCsYHJ6SRsPmjkAPDoQemc4AroeOwqiqqnZSvbc86tQwLotUOZSfR6r7zyk200bBVbDHjGa9D0j4w/Ejw7aLptt4gn1DTUwFtdQhjv4VA/hCzK4UfTFdhqXwn8K+LcX3gPxNF4dvmyzaR4il2opHURXijawzwBIFPqaw7z4I/FDTh5n/CJ3l/avkrNpirfRuPUNCWzW8cQqy5qTTPF9nVg7ajIPj78QrNsabLpukA/ebTtCs7Z+f8AbWLcPqCK4/XfEV34h1Br7xRcXeq3shAaa6laZ+O25iT+FdJbfCv4nXj+XD4F8Qc8ZfS5kH4llArVPwS1nSH874k6zoPgW1U+a41LUY3uWH+xbxF5GPsQK0jKbeqM3h6mIkou55dugku4VtbMkFsfKhJz2wK9Ze6svgF4ekk1mRY/iZrNo0VvaDBk0WzkHzSyY+5PIpwq8FFJJwSBWVqPxV8NfDVWg+DWmT654hCkf8JTrMCotue7WlrkhD6PJlhzxzXherate6td3V3qTyXN9csWmnll3ySueSxY8k855rRwnV0sexQwEcOnztr1W469i0OQyTLITIWYlVOB7DFUYraxu0hwy242HOX53Z71n3KSTSZETDGBnHX3qE20gXdtz147jHWqhRaj8TInFxlaxspp2mvcCL7Q5wpO7cMHnpVG7tFEMPkLl/nzj+JR/FVT7LLtQ7fv/dHekljliI8zI6jrWkack781zLmT0IqcpHem05enNbsaJY9vmjONtWRbRSc7gvtVVFVnAJwKtG0Vm+STFQzGbs9yAxK0rKrcCp7WzSaVkZu3FA08k/LIKGtWidRHJ8x6807+ZDknomaCaGhUgyfP2qH+xSs4jeZc4ycdauJaMkCyLM28VivdSpcs+87wcZqacua9mZpVLtcxpjROdgkJZiQtLZ+HZp5mVnVABkHNUBqlwB97nOQfSnWl/cRzeYkh3VcVPW7NavO0uR9PxNe58MTwW8knnbtnUVzp+9+JrXuPEN5JG0DsNrcE1jk8mtI36kUVUS98XNFNzS9as2JEiklz5aM+OuBmr9t4f1C7tWuLeEtGjbSM4OfpVW1vriyLG1laPd1x3rZ0/wAXXen28sYjSWR2LeY3UZ6/yrlrPEJfukmd2FjhJS/fyaXkZkulX8MjRPbzEjrhSRXrfhfxJ4f0Dwrb2+qWcyXEqFZSYzznqc1xH/Cw7ry2QWsasSx3A88j/wCvW9pOr3F/p6XL2Mc+8Ybc/wDd46V4mOpYjF01GtTsk+jPXw+AweIm44eo2/Q1/EE/hzWtIuIfDrJZ4lRhcMrEqMcjNZnga50e80qaw1q7kFylyX8xS29kHoewqK312aUSQ3GkOMuW2gALgHPPvVAeLLa4jlhs9MaJ9jrI8aDcM981xRwlZUXRUZb3vdNr5inl1GLTdS1/7r1L3xDtNBsprC3F1eTyBCxzJvKKeg56VvJN4duYLdv7Wni2QoFhhnIXgcgiuH8KCxg8XCbU1kuLAKf3lxGTyRwSK6y78X+HINV8jTtHQSR3B+YQ8lcdRU4ihUgoUYqcnFXvpbX1PI9jNatdbFfxYbbTNLWfTdZuAHlICLJuCg9gO9VPD3im60+GT+ydbubaSaIB5vtBRg2emARSjXvDF78mpRNcGJWAPkEDlj2HSsu51HwnPHKsNmLeUDEbYIIIPBrpwt6cPZ1KUpPvZHPVoSq25Z8ptal4g1u8tPs994v1eZS+91e/c8Y6Y3Y7Vy9zp4ZpJ4b8wqcN82DuJHJrI1SezmaRoSpfeNhHHbnPtWxfXELsubU3BKqOOQox2/SvoaSlOHuxZw16eJwlVclVy80ZOoLJYorwXTzM5Ks2BjFSSWkmAySgKFB+dfmz3pbmWyRCz2bICSBuUjmqr7C8zFSofaUGD93vir9+GqRrTq4itaEptebHvFJI2LeRWw5HIxjFReRMG2IyeaQW/Oo28hD8zPExbkZxg0LIuzHnFVCnndz7VlzWurHbUhiLXdRMlUXESKhkiVkZR6n6VDcQTTKFjAYl3Jx6+v0qkbqY9ZGP405b64U5EhrSzOFU5J3VivTkAPWm05RmqZ1IsQiMEhsfjVhIogSY5aprEGk2k082smfk5FZON+pXtIrSSLLxoqMUkJP1qvChmkwZOR0NQtGwYr3FCRux+XqKai0txc0L3sa488x7BMDjpVRbDdOEeQZPJquscwG4buKRWlWQMN24UoxceoTlTcXyKzNRdCkZz84CdjTLXSJ5J2QMFA71ENTvMZ3Ege1RQ3tyk29GYt6VouY4+WrbVmhc6DcRRvKXVgvJrH71qS6zdyQsjrgNwTisk9apN9SqXPb3zovCWiWmt3k8V9K6COPcqoQCx/Guyufhpo8DW8Y1k+bOwVAMHnGTXlquyHKMVPqDipBcy5U+bJlTlTuPBrz6+HxFSpzU6riu1joTS6Hph+Eat9zVo1JDEKy84FE/wrhlMkWmXzSzAxhWdcLyMk/SvOl1W9U5F5PnnnzDU8XiLVYdvlahcLs4HzniuV4bMd1X/Ad4djb1TwJcaTP5NzqFkr9gZMZFdn4f8E6mNBVre/i804MMY+4cnue9eT3t/c6hN517M00nTcxya9Y8K3mjxeHLe3fVniuH28+Z80ZzzgVjj5YyhQi+e7vraJvQrTozcqbafqYPimx1TQEtrq5uop5RIyGGMHaBj/Cquj+GdTMCPYrFcSXkYmNvyNqZ4O7+lb3ihprW0KaPPJdMTI0jzsDlMdQKdoEN1Np9iNP1T7Hbrb/O7EMd2eVwelYrG1lhlO6vfe36GzxVeVRScm2v+GZUn07xJzE+mR7toGVlHGPWsS70TWLPWnu/sb3A6P5ZyASOma7vT476AXawatDeM4I3Ov3Gx14qmsusRW/k2l5BdSvKBnZgYx1J/CsVmFZ3i+W3zRtUx2Iq8rnJuzv06HLXEF4IVB05rQNH9/gkAEcms27FvdS30otnQF05KYJXuR9a6+NNShLSX/2bEat0YnjOcYrLvvEt4mo/ZvsaONw5U8HPSumhXmpe6k/mcmLq1MWlzvY5X7Lp323YVmjXk7ZBgYxVxY5BIz214ilgOAOy9K1Hu40hZRp7XvznMhAbn61QknsiCJdNkRh6R9K9Snjai2X4nnOhLpMoX0MvktJNKGdRuXYPXrUUFxLJAoXaGdSo4PQepq3G9nIAbm3eHGQqDPIzUTDTgv7rei85XcRziulYypfW5SpyS+Ipz2s024fIWY72Oe1QNpsm4qjB2GOnvWrGlvLFGxne3XyyAM8k596s+RbqEWGRpc7VyG5xzzWcsVd6hy1ejRzktlPCu6RCFzjNONhLyEKu4AJUdRmrLFprkWzXK+X5m3OO31rSFlLLvaBvs3lkLulAy2DwaqVZRtcdqtuhzVOUZptOUZrdmyJERi4CnmrDC4j4U5FQRpukA3Yq3mZTx8y1DMaj1KoSUszY570+LzUfdtpu+VJD609ZpWJ46UO5fuuOpP8AaZE5ZPl71A13ul3EfL6U93keM5SqfltnoaIruZqMbsureICCR0PSpLTUI4pizRgA98Vn+W2ORSBSTgAk00kXOKnub9xqVrJbOowWbpxVaK1s5FgWV/L3gHd6nPSsoow6qaTJ9aThfZ2FTioQlFdTpJvD9vD5khuP3S8Ad89qy7mxjiHyOxO8r09Ko+dIV2l22+maDNITku350oxmt5XCinBv2jubWgeGrjXzKYZEjjhI3luvPpWvc/DrUBNILJ45Ig2AWbBx61ylpf3NiWNpO8JYYbacZq6PEuqhCn22Xae2a5asMW6l6c1bs0aLl6mp/wAIFqyI7zLHGqqTy2elWNI0bVNHuYpLnTFmgLKWLAZAz61TbxzqjW0UO5dyHJcjJb60snjrVJoyk3lODjqvp3rmccfOLjNRaY/dO6vvGGmvfrb/ANnvJeRkJ9zdx3FcZMv2LU5Jws7QzB2ZPKICEn0rJTxFcx6mL5VXdu3FOxrfT4guYZRLaIZDjaB0xXPHB1MMrU43TWuprTq8k1PqirHqSWUUg05bgSSKAwIPJzTPt4jlkjkupLUhwflYg4xUkvjh5UK/ZFQ4GCp6U3/hJLW5DL9hDTuxbc4B5rb2dRayp/imdn1xzaXIvSwQajIjR4vJZoyx/wBY3GO5rnZr6eS7aczM0m7Iat6DU4JY0+22vKpg/IMde1QveacWkX7KImGAh255ram+ST9z8jmrXn73LyoqR+Ib3iMMiqTzhcVcXUL8+aAy7VbA3A5PvVPUhHOXMKZctlQo5AA5qtvX5RK7rhcY5zmuunCg43lAxjHndlKxoDV5oArERzMwIyPaphqTskbSxorO2F9M471jjyJBsyVUEc1MiLbhcSt6ge9N08O7+7Y19hUkvdkjQbUo1UNdW6yN8yYHODUyXccmNqiPcqErt/h9PxrHNuXAAn4LE/jTvPkjVVQqWC/eI6gVi6NPoZyoYiKvZELCFLne8LrDv7+ma1DJZXDSG7uVKn/VhMjC+9ZN1ftcxLGVA7sff/JqnW0qXPbWxjByt7yCnKM02nKCelbstE8MeW5PIqyizIeGDCobUrubzBkkcUty+xsQbhnrWD5m7Ir929JIHgkG52Iz6VFE0iuxAyajMsnQsaRJWRty9a0SlYGqb2WhdE0vVl4FQmV2lyFPPam/a5M88037Qxk3Gkk+qIlCmleJMJG3fcORRDcsshwg5p321f7lRx3Wx87RTS8jF3lui1PdK0LDb19qzaty3SPGVC8mqR61SHTjZbGhpcdrLOy3rbV2/Lk4Ga3RY6Gw8pJhubA3lulc9p9xDBKWuE3KRgcZxWrNqemu0YS2G3PzkrziuKtGbnpf5GyJ/wCytJFx5KTtIzKdpzgZqZvCdsqsft27C5AwKqrPo2MshLeoyKl36Uw8uGTYGAy245FczdVbOX3D0FufDlrAHYTMw2FlVevFc9FaSzECJc5OAMjNb7NY290qwTSSZU4Jk4FRjSbMMsovdr/e4PetqdWUF7zb+QrEMvhe7SJGTDyHOVHYVVuNFntoGlkeP5QCwzyM1sape3MMamxnd+oY5zxiqtvBNdIuZBIZVDNvHy8dBRCrV5VKTVgaRhxW8s4YxRs4XrgZxUkVvcrKvlxPv7fLXQadbXGnLNs8t9/IweFNE9xcs7NOQqqfl2/xGreIbk0rWGtNTAe8nz5cvOOCuKYbklyXBHOcD1rUh0+aG9jmaA7By2SDzVme4jFy+bFmAPZRzVe1inaKuVKpOatJmN9uKvujXDYI/Ori6nEFy43Nj071YN1bv/x8WLDA+UbahhksZGYXFv5ahvlwvUVSqafCznlSjPcrPqEckbJ5YjyO1KLu3dSZVDEdARV4x6WoQ7SoOfvZ5FVLyO1NuxtFX5W5OecVdOvaV1FlKKjFxQwTWRPMZHXsev5021+ymOQTk53DHPb2qsLfDx72G1mxwea0TpvkSS7hHt2nblwT7cVvUrKVkyZJ20bI41sG/wBYrRnJ4yaZMtuyMUChQnB77s1ai06VUkiaNcuyhWxkA0rr9itozcw+Yoc4YYIrFVIt2TMXGS1VzDpyZ7U2nocdBWzOtbj4ywkBVeasfadvDx81XR2WQED8KtLcJ92RMGoZlUWuxV3hnZivFPhaPed4+U0qzrvbcvymnebEHXCcDrQ35F8qcb3JR9nI2jHNQEQrLgcirYFp2PLdagmhgjmVVYtWcZa2MuW3UcIIc53DntmoY4YmcgtU88EeAV9O1Z+cHitI+8rjSbvqXZbVEQspORVE07exGCTim1S0Limt2FFS29tJdPshXc2M1Zl0i6iVSY92f7vOKTnFOzZRSClugJqWOCRl3hdyin/ZLqI/6qRT9KexubX5ZEKhTk5FLmT2ZpDkv7wW0ixyMXjIBGOmakaSARs0KHdjuOlNjvjvBkX5cdqZ9szIxK5Q9BSszsU4RjZS/AWWRPLYwsQxPY44qSDasS7JnDEHgNjBqKa6jkjZViCse9JHPGirhfmAI6d6LabE3hz3bTLlvNJGsixXDfMMNmpvPljgbfIZHz8rDqKoB7Vhl/vEDpxUsAjlXgEYb5Rms5Qju0actNq1l94f2vdR3AZpN4XjHYinf25P5zSBE5ORkdKjnhj8yPy4X5boAelTMlrGw8yMo3oQaShTkr2PMnPlewwa1MZGeRVfdjjsKnXxAwYboEIHaqk8NuqLJE3Jf8MVI0NtO5ZWwASDz1raGFp1VohKd9Swmtwlt01uG4IA9BSw3ccqu0kI8neDtUfpVVtPiCgCX5icZ7Gp4IJoOkkbBiMnqf8APNaxwMb6oHLsWGv7cIp+x4HOMjk/Sh7mznT7qKDg8nnoarRXUzMCNpQKT+Xb9arNp0z/AD4ChgWx6e1YSoUY6xZEpW0bsWrueRYlkjuA2HB4UDkdKtTWs1/GlushEaLv3kDaxPpisGa3kg2+apXcMimCR16Mwx71MqV7OOli4bb3P//Z";
const replacementTextInput = document.getElementById('Name');
document.getElementById("icon").src = "data:image/jpeg;base64," + ico;

function replaceBetweenMarkers(data, startMarker, endMarker, newContent, isbytes) {
	const textDecoder = new TextDecoder('utf-8');
	const textEncoder = new TextEncoder();
	
	// Convert markers and content to binary
	const startMarkerBytes = textEncoder.encode(startMarker);
	const endMarkerBytes = textEncoder.encode(endMarker);
	if(isbytes){
		// Создаем Uint8Array
		var newContentBytes = new Uint8Array(newContent.length);
		
		// Заполняем массив значениями
		for (let i = 0; i < newContent.length; i++) {
			newContentBytes[i] = newContent.charCodeAt(i);
		}
	}
	else
		var newContentBytes = textEncoder.encode(newContent);
	
	// Find start marker
	let startPos = -1;
	outer: for (let i = 0; i < data.length - startMarkerBytes.length; i++) {
		for (let j = 0; j < startMarkerBytes.length; j++) {
			if (data[i + j] !== startMarkerBytes[j]) {
				continue outer;
			}
		}
		startPos = i;
		break;
	}
	
	if (startPos === -1) {
		throw new Error('Start marker not found');
	}
	
	// Find end marker
	let endPos = -1;
	outer: for (let i = startPos; i < data.length - endMarkerBytes.length; i++) {
		for (let j = 0; j < endMarkerBytes.length; j++) {
			if (data[i + j] !== endMarkerBytes[j]) {
				continue outer;
			}
		}
		endPos = i + endMarkerBytes.length;
		break;
	}
	
	if (endPos === -1) {
		throw new Error('End marker not found');
	}
	
	// Calculate block size
	const oldBlockSize = endPos - startPos;
	
	// Create new buffer with same size
	const newBuffer = new Uint8Array(data.length);
	newBuffer.set(data);
	
	// Replace content
	if (newContentBytes.length <= oldBlockSize) {
		// New content fits - copy and pad with zeros
		newBuffer.set(newContentBytes, startPos);
		newBuffer.fill(0, startPos + newContentBytes.length, endPos);
	} else {
		// New content is too long - truncate it
		const truncatedContent = newContentBytes.slice(0, oldBlockSize);
		newBuffer.set(truncatedContent, startPos);
	}
	
	return newBuffer;
}

/**
 * Replaces ALL occurrences of a binary string with replacement text,
 * padding with zeros to maintain original length
 * 
 * @param {Uint8Array} originalData - Original binary data
 * @param {string} targetString - String to find and replace
 * @param {string} replacementText - Replacement text
 * @returns {Uint8Array} New data with replacements
 */
function replaceAllBinaryStrings(originalData, targetString, replacementText) {
    // Validate input
    if (!replacementText || replacementText.trim() === '') {
        throw new Error('Replacement text cannot be empty');
    }
    if (!targetString || targetString.trim() === '') {
        throw new Error('Target string cannot be empty');
    }

    // Convert strings to binary
    const encoder = new TextEncoder();
    const targetBytes = encoder.encode(targetString);
    let replacementBytes = encoder.encode(replacementText);

    // Validate replacement length
    if (replacementBytes.length > targetBytes.length) {
        replacementBytes = replacementBytes.slice(0, targetBytes.length);
        console.warn(`Replacement text truncated to ${targetBytes.length} bytes`);
    }

    // Create padded replacement (filled with zeros)
    const paddedReplacement = new Uint8Array(targetBytes.length);
    paddedReplacement.set(replacementBytes); // Rest will be zeros

    // Create copy of original data
    const newData = new Uint8Array(originalData);
    
    // Find and replace ALL occurrences
    let position = 0;
    let replacementsCount = 0;
    
    while (position !== -1) {
        position = findSequence(newData, targetBytes, position);
        
        if (position !== -1) {
            newData.set(paddedReplacement, position);
            position += targetBytes.length;
            replacementsCount++;
        }
    }

    if (replacementsCount === 0) {
        throw new Error('Target string not found in file');
    }

    console.log(`Replaced ${replacementsCount} occurrences`);
    return newData;
}

/**
 * Improved sequence finder with start position
 */
function findSequence(array, sequence, startPos = 0) {
    outer: for (let i = startPos; i <= array.length - sequence.length; i++) {
        for (let j = 0; j < sequence.length; j++) {
            if (array[i + j] !== sequence[j]) {
                continue outer;
            } 
        }
        return i;
    }
    return -1;
}

function getJScode(){
	rebuildProtoObjectArray();
	store_image_array = [];
	Blockly.JavaScript.lastError = false;
	var script = Blockly.JavaScript.workspaceToCode(workspace);
	var loadImage = '';
	for(var i = 0; i < store_image_array.length; i++){
		loadImage += `Draw.loadImage(${i},"${store_image_array[i].data}");\n`
	}
	return loadImage + script;
}

function buildSwitch(){
		// Заменяем контент между метками
	const state = getJScode();
	const replacementText = replacementTextInput.value.trim();
	if(newIco)
		var img = atob(newIco);
	else
		var img = atob(ico);
	// Validate input
	if (!replacementText) {
		showSwitchModal('error', Blockly.Msg['ENTER_NAME'], false, 'ok');
		throw new Error('Please enter replacement text');
	}
	var modifiedFile = replaceAllBinaryStrings(fileData_bytes, TARGET_STRING, replacementText);
	modifiedFile = replaceBetweenMarkers(modifiedFile
		,
		"+ICONFORCHANGE+",
		"+ENDICONFORCHANGE+",
		img, true
	);
	modifiedFile = replaceBetweenMarkers(modifiedFile
		,
		"/*====================START=======================*/",
		"/*====================END=======================*/",
		state, false
	);
	
	// Сохраняем результат
	const blob = new Blob([modifiedFile], {type: 'application/octet-stream'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = replacementText + '.nro';
	a.click();
}

function compressJS(code) {
    // 1. Удаляем все комментарии
    let noComments = code
        .replace(/\/\/.*$/gm, '')              // Однострочные
        .replace(/\/\*[\s\S]*?\*\//g, '');     // Многострочные
    
    // 2. Удаляем лишние пробелы и переносы строк
    return noComments
        .replace(/\s+/g, ' ')                  // Все пробелы -> один пробел
        .replace(/\s*([=+\-*\/%&|^~!<>?:;,{}()[\]])\s*/g, '$1') // Удаляем пробелы вокруг операторов
        .trim();
}

function buildHTML() {
	reset_game();
	
	function serializeObject(obj) {
        const props = [];
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'function') {
                props.push(`${key}: ${value.toString()}`);
            } else {
                props.push(`${key}: ${JSON.stringify(value)}`);
            }
        }
        return `{\n${props.map(p => `        ${p}`).join(',\n')}\n    }`;
    }
	
	const customScript = getJScode();
	// Формируем содержимое HTML-документа
	// Получаем исходный код существующих объектов
    const drawCode = compressJS(serializeObject(Draw));
    const gameCode = compressJS(serializeObject(Game));
    const gameLoopCode = compressJS(game_loop.toString());

    const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${replacementTextInput.value}</title></head>
<body style="margin:0;padding:0;overflow:hidden;background-color:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;">
<canvas width="1280" height="720" id="cnv" style="background-color:black;box-shadow:0 0 10px rgba(0,0,0,0.5);width:100vw;height:56.25vw;max-height:100vh;max-width:177.78vh;object-fit:contain;"></canvas>
<script>var image_array = [];var game_helper_timers = [];var gravitation = 0;var gamepads = {};var inputState = {};var local = {};var draw_bounding_box = false;
const canvas = document.getElementById("cnv");const ctx = canvas.getContext("2d");const Draw = ${drawCode};const Game = ${gameCode};var debugShowExpandedObjectsBorder = false;
const globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();const MAX_CONCURRENT_MELODIES = 8;let activeMelodies = 0;const melodyQueue = [];
function checkTouchButtons(x,y,isPressed){if(!Game.enableTouchInput)return!1;for(const btnId in inputState.touchButtons){const btn=inputState.touchButtons[btnId];
if(x>=btn.x&&x<=btn.x+btn.width&&y>=btn.y&&y<=btn.y+btn.height){btn.isPressed=isPressed;inputState.keys[btn.keyCode]=isPressed;if(isPressed){inputState.pressKeys[btn.keyCode]=!0};return!0}}return!1}
${gameLoopCode}
Game.initSensorInput();Game.init();Game.enableTouchInput='ontouchstart' in window||(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)||(navigator.maxTouchPoints>0)||(navigator.msMaxTouchPoints>0);
${customScript}
game_loop();</script></body></html>`;

    // Создаем и скачиваем файл
    const blob = new Blob([htmlContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
	if(replacementTextInput.value.trim().length > 0)
		a.download = replacementTextInput.value.trim() + '.html';
	else
		a.download = 'game.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Пример использования:
// exportGamePage();
// Или с дополнительным скриптом:
// exportGamePage('console.log("Custom initialization");');