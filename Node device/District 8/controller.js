serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let data = serial.readLine()
    // serial.writeLine("command received is: " + data)
    let typeOfLockdown = -1;
    if (data.includes('LOCKDOWN')) {
        let buffer = data.split(',');
        if (parseInt(buffer[1]) == 2 && parseInt(buffer[2]) == 1) { //raise global lockdown
            rxMessagesHistory.push(commandCount + "," + data) //0,LOCKDOWN,2,1
            radio.setGroup(originalGroup)
            radio.sendString(commandCount + "," + data);
            serial.writeLine("Command being sent is: " + commandCount + "," + data + " to radio group: " + originalGroup)
            commandCount += 1;
        } else if (parseInt(buffer[1]) == 2 && parseInt(buffer[2]) == 0) { // lower global lockdown
            rxMessagesHistory.push(commandCount + "," + data) //0,LOCKDOWN,2,0
            radio.setGroup(originalGroup)
            radio.sendString(commandCount + "," + data);
            serial.writeLine("Command being sent is: " + commandCount + "," + data + " to radio group: " + originalGroup)
            commandCount += 1;
        } else if (parseInt(buffer[1]) == 1 && parseInt(buffer[2]) == 0) { // lower local lockdown
            rxMessagesHistory.push(commandCount + "," + data) //0,LOCKDOWN,1,0
            radio.setGroup(originalGroup)
            radio.sendString(commandCount + "," + data);
            serial.writeLine("Command being sent is: " + commandCount + "," + data + " to radio group: " + originalGroup)
            commandCount += 1;
        } else if (parseInt(buffer[1]) == 1 && parseInt(buffer[2]) == 1) { // raise local lockdown
            rxMessagesHistory.push(commandCount + "," + data) //0,LOCKDOWN,1,1
            radio.setGroup(originalGroup)
            radio.sendString(commandCount + "," + data);
            serial.writeLine("Command being sent is: " + commandCount + "," + data + " to radio group: " + originalGroup)
            commandCount += 1;
        }
    }
})
radio.onReceivedString(function (receivedString) {
    serial.writeLine("Radio has received STRING: " + receivedString)
    buffer1 = receivedString.split(",")
    if (receivedString.includes("LOCKDOWN")) {
        //do nothing
    } else {
        if (parseInt(buffer1[4]) != originalGroup) { //is an intruder
            buffer1 = receivedString.split(",")
            if (parseInt(buffer1[2]) == 1) { //intruder is one hop away
                serial.writeLine("INTRU," + receivedString)
            }
        } else if (parseInt(buffer1[4]) == originalGroup) { //is not an intruder
            // serial.writeLine("it is not an intruder")
            if (!receivedString.includes("LOCKDOWN")) { // is NOT a command
                // serial.writeLine("it is not a command")
                buffer1 = receivedString.split(",")
                saveCurrentMessage = 1

                for (let rxMsgHis of rxMessagesHistory) {
                    buffer2 = rxMsgHis.split(",")
                    if (buffer1[0] == buffer2[0] && buffer1[1] == buffer2[1]) {
                        saveCurrentMessage = 0
                        break
                    }
                }
                // serial.writeLine("save Currnet message: " + saveCurrentMessage)
                if (saveCurrentMessage == 1) {
                    serial.writeLine("INHAB," + receivedString)
                    rxMessagesHistory.push(receivedString)
                }
            }
        }
    }
})

input.onButtonPressed(Button.A, function () {
    stop = !stop;
})
input.onButtonPressed(Button.B, function () {
    serial.writeLine("Button B is pressed")
    clearTrash = !clearTrash
})

let stop = false;
// let state = 0;
let messageCounter: number = 0;
let rxMessagesHistory: string[] = [];
let buffer1: string[]
let buffer2: string[]
let commandCount = 0;
let saveCurrentMessage = 0;
let startTime = input.runningTime()
let startTime2 = input.runningTime()
let originalGroup = 8; //to change
let currentIndex = 0;
let allIndex = [9]; //to change
let intruderDetectionInProgress = false;
let currentGroup = originalGroup;
let clearTrashTime = input.runningTime();
let clearTrash = false;
radio.setGroup(originalGroup)
radio.setTransmitSerialNumber(true)
radio.setTransmitPower(2)
basic.showIcon(IconNames.Yes)
serial.writeLine("")
serial.writeLine("")
serial.writeLine("")
serial.writeLine("Controller Device: " + control.deviceName())
basic.forever(function () {
    if (stop) {
        basic.showIcon(IconNames.Heart)
        if (intruderDetectionInProgress) { // if we are scanning for intruders
            if (input.runningTime() - startTime2 < 2000) { //if it has been less than 1s since we last changed the radio group, do nothing (keep receiving)
                // serial.writeLine("scanning: " + currentGroup)
            } else { //if it has been more than 1s since we changed the radio group, change the radio group
                serial.writeLine("changing the radio group...")
                incrementCurrentIndex(); // change the radio group
                radio.setGroup(allIndex[currentIndex]);
                currentGroup = allIndex[currentIndex];
                serial.writeLine("scanning: " + currentGroup)
                startTime2 = input.runningTime();// the start time for a radio group
                // if (!intruderDetectionInProgress) { // only runs if the list of groups has been exhausted
                //     if (currentGroup != originalGroup) { // right after intruder detection
                //         serial.writeLine("Setting up to listen to original radio group but current group is still: " + currentGroup)
                //         radio.setGroup(originalGroup)
                //         currentGroup = originalGroup;
                //         tearDownIntruderDetection();
                //     }
                //     // serial.writeLine("listening to original radio group..." + currentGroup)
                // }
            }
        } else if (input.runningTime() - startTime > 20000 && !intruderDetectionInProgress) { // if time from last intruder check is more than 7s, start intruder checks
            serial.writeLine("setting up of intruder detection")
            setUpIntruderDetection(); // still in the original group
            startTime = input.runningTime(); // the start time of intruder checks
            startTime2 = input.runningTime();// the start time for a radio group
            radio.setGroup(allIndex[currentIndex]);
            currentGroup = allIndex[currentIndex];
            serial.writeLine("scanning: " + currentGroup)
        } else if (!intruderDetectionInProgress) { // only runs if the list of groups has been exhausted
            if (currentGroup != originalGroup) { // right after intruder detection
                serial.writeLine("Setting up to listen to original radio group but current group is still: " + currentGroup)
                radio.setGroup(originalGroup)
                currentGroup = originalGroup;
                tearDownIntruderDetection();
            }
            // serial.writeLine("listening to original radio group..." + currentGroup)
        }
    }
    if (clearTrash) {
        if (input.runningTime() - clearTrashTime > 20000) {
            serial.writeLine("clearing trash...")
            serial.writeLine("")
            rxMessagesHistory = [];
            clearTrashTime = input.runningTime();
        }
    }
})

function setUpIntruderDetection() {
    intruderDetectionInProgress = true;
    // radio.sendNumber(0); //tells the mbits to stop sending their data
    // state = 0;
}

function tearDownIntruderDetection() {
    // radio.sendNumber(1) //tells the mbits to start sending their data
    // state = 1;
}

function incrementCurrentIndex() {
    currentIndex += 1;
    // serial.writeLine("curent Index: " + currentIndex)
    if (currentIndex > 0) {
        currentIndex = 0;
        intruderDetectionInProgress = false;
    }
}
