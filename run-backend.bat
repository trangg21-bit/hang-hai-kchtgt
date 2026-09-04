@echo off
set JAVA_HOME=C:\Users\sonpn\AppData\Local\Programs\Microsoft\jdk-17.0.18.8-hotspot
"%JAVA_HOME%\bin\java.exe" -Dspring.profiles.active=local -Dfile.encoding=UTF-8 -jar target\kchtg-0.1.0-SNAPSHOT.jar
