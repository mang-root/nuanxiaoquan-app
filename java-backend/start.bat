@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;C:\apache-maven-3.9.15\bin;%PATH%
mvn spring-boot:run
