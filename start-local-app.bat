@echo off
cd /d C:\Users\trangtt1\hang-hai-kchtgt
echo Starting Spring Boot app with local profile...
start "SpringBootApp" /B mvn spring-boot:run -Dspring-boot.run.profiles=local > C:\Users\trangtt1\AppData\Local\Temp\spring_boot_forever.log 2>&1
echo App started in background
echo Log file: C:\Users\trangtt1\AppData\Local\Temp\spring_boot_forever.log
timeout /t 30
echo Checking if app is running...
netstat -ano | findstr :8080
echo Done.
