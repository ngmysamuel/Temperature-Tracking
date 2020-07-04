import serial
import time
import sqlite3
import RPi.GPIO as GPIO
import string
import requests


# Pin  Definitions
greenPin = 7
redPin = 11
bluePin = 13

#set up
GPIO.setmode(GPIO.BOARD)
GPIO.setup(greenPin, GPIO.OUT)
GPIO.setup(redPin, GPIO.OUT)
GPIO.setup(bluePin, GPIO.OUT)

# Event Status
isLocalLockdown = False
isGlobalLockdown = False
isIntruder = False
isIntruderPrev = False
lightStatus = False

#personal information
originalGroup = str(9) #it is possible to not hardcode the radio group to each rhub.py but you must ensure that only inhabitants come in contact at first
count = 0
loc = False

def sendCommand(command):

    command = command + '\n'
    print("command is: ", command)
    ser.write(str.encode(command))


def waitResponse():

    response = ser.readline()
    response = response.decode('utf-8').strip()

    return response


def saveTemperatureData(data):
    print(data)
    c = conn.cursor()
    isIntruder = "N"
    data = data.split(',')
    
    if data[0] == "INTRU":
        isIntruder = "Y"
        
    alphArray = list(string.ascii_lowercase)
    alphSet = set(alphArray)
    sentArray = list(data[2].lower())
    x = ""
    for u in sentArray:
        if u in alphSet:
            u = alphArray.index(u) + 1
            x += str(u)

    sql = "INSERT INTO temperature (count, trackerName, temp, radioGroup, isintruder, deviceid, timestamp) VALUES(" + data[1] + ", '" + data[2] + "'," + data[4] + ", " + data[5] + ", '" + isIntruder + "', '" + x + "', datetime('now', 'localtime'))"
    c.execute(sql)

    conn.commit()
    
    
def saveEventData(data, eventType):
    c = conn.cursor()
    data = data.split(',')

    alphArray = list(string.ascii_lowercase)
    alphSet = set(alphArray)
    sentArray = list(data[2].lower())
    x = ""
    for u in sentArray:
        if u in alphSet:
            u = alphArray.index(u) + 1
            x += str(u)
    #         print(x)
    # print(x)
    # print(data[2])
    
    sql = "INSERT INTO event (trackerName, event, radioGroup, deviceid, timestamp) VALUES(" + "'" + data[2] + "'," + eventType + ", " + data[5] + ", '" + x + "',datetime('now', 'localtime'))"
    c.execute(sql)

    conn.commit()

try:

    print("Listening on /dev/ttyACM0... Press CTRL+C to exit")
    ser = serial.Serial(port='/dev/ttyACM0', baudrate=115200, timeout=1)

    conn = sqlite3.connect('temperature.db')

    #HANDSHAKING
    requests.get("http://localhost:5000/api/handshake/"+originalGroup)
    

    while True:
        msg = ser.readline()
        smsg = msg.decode('utf-8').strip()
        if len(smsg) > 0:
            print('FRM MBIT: {}'.format(smsg))
        # loc = False
        buffer = smsg.split(",")
        if (buffer[0] == 'INTRU' or buffer[0] == "INHAB"):
            if (buffer[0] == 'INTRU'):
                # raise event 2: push to DB
                print("RPI: intruder detected")
                saveEventData(smsg, "2")
                saveTemperatureData(smsg)
                isIntruder = True
                loc = True
            if (buffer[0] == "INHAB"): 
                # store the data into database
                print("RPI: inhabitant detected")
                saveTemperatureData(smsg)
                # originalGroup = buffer[5]
            if (int(buffer[4]) >= 38):
                # raise event 1: push to DB
                print("RPI: fever")
                req = requests.get("http://localhost:5000/api/activatelocallockdown/"+originalGroup)
                isLocalLockdown = True
                sendCommand("LOCKDOWN,1,1")
                saveEventData(smsg, "1")
        if ("original radio group" in smsg): #at the end of a intruder detecting run
            if (not loc): # no intruder
                count += 1
            if (loc): # detected an intruder
                count = 0
            if (count >= 2):
                count = 0
                isIntruder = False
        if ("intruder detection" in smsg):
            loc = False
        # time.sleep(1)        


        #STATUS
        reqL = requests.get("http://localhost:5000/api/getLocalStatus")
        newLocalStatus = reqL.json()
        if (isLocalLockdown != newLocalStatus):
            isLocalLockdown = newLocalStatus
            if (not isLocalLockdown):
                sendCommand("LOCKDOWN,1,0") # deactivate local lockdown
                print("DE-activating lockdown")
        # print("getLocalStatus is: ", isLocalLockdown)
        reqG = requests.get("http://localhost:5000/api/getGlobalStatus")
        newGlobalStatus = reqG.json()
        if (isGlobalLockdown != newGlobalStatus):
            isGlobalLockdown = newGlobalStatus
            if (isGlobalLockdown):
                print("activating lockdown")
                sendCommand("LOCKDOWN,2,1") # activate global lockdown
            else:
                print("DE-activating lockdown")
                sendCommand("LOCKDOWN,2,0") # deactivate global lockdown
        

        # LIGHTS
        if (not isGlobalLockdown and not isLocalLockdown): 
            GPIO.output(greenPin, True)
            GPIO.output(redPin, False)
        else:
            GPIO.output(greenPin, False)
        if (isGlobalLockdown):
            lightStatus = not lightStatus
            GPIO.output(redPin, lightStatus)
        elif (isLocalLockdown):
            GPIO.output(redPin, True)
        GPIO.output(bluePin, isIntruder)
        
        # time.sleep(2)

except KeyboardInterrupt:

    print("Program terminated!")

except Error as err:

    print('********** ERROR: {}'.format(err))

finally:

    if ser.is_open:
        ser.close()

    conn.close()
    GPIO.cleanup()
