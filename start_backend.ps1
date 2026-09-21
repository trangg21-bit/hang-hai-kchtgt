$cp = Get-Content -Path "D:\project\hang-hai-kchtgt\classpath.txt" -Raw
$fullCp = "target\classes;" + $cp.Trim()
$javaExe = "C:\Users\sonpn\AppData\Local\Programs\Microsoft\jdk-17.0.18.8-hotspot\bin\java.exe"
& $javaExe "-XX:TieredStopAtLevel=1" "-Dspring.profiles.active=local" "-Dfile.encoding=UTF-8" "-Djava.net.preferIPv4Stack=true" "-Xms512m" "-Xmx2048m" "-cp" $fullCp "com.hanghai.kchtg.KchtgApplication"
