@ECHO OFF
c:
cd %USERPROFILE%\Documents\Arduino\
if not exist hardware mkdir hardware
cd hardware
if not exist esp8266com mkdir esp8266com
cd esp8266com
@ECHO ON
git clone https://github.com/esp8266/Arduino.git esp8266
@ECHO OFF
cd esp8266
@ECHO ON
git submodule update --init
@ECHO OFF
cd tools
@ECHO ON
python3 get.py
