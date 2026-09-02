@echo off
set JAVA_HOME=C:\Users\Admin\.jdks\ms-17.0.20
"C:\Users\Admin\.jdks\ms-17.0.20\bin\java.exe" -Dspring.profiles.active=local-h2 -Dfile.encoding=UTF-8 -jar target\kchtg-0.1.0-SNAPSHOT.jar
