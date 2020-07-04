radio.onReceivedNumber(function (receivedNumber: number) {
    // serial.writeLine("number received")
    // if (receivedNumber == 0) {
    //     ifTransmit = false;
    // } else if (receivedNumber == 1) {
    //     ifTransmit = true;
    // }
})

radio.onReceivedString(function (receivedString) {
    serial.writeLine("I have received a string: " + receivedString)
    buffer1 = receivedString.split(",");
    saveCurrentMessage = true;//
    saveCurrentCommand = true;//
    let isCommand = false;

    if (receivedString.includes("LOCKDOWN")) { //is a command
        isCommand = true;
        for (let cmd of commandHistory) {
            let buffer2 = cmd.split(",");
            if (buffer2[0] == buffer1[0]) {
                saveCurrentCommand = false;
                break;
            }
        }
    } else { //is not a command
        for (let rxMsgHis of rxMessagesHistory) {
            buffer2 = rxMsgHis.split(",")
            if (buffer1[0] == buffer2[0] && buffer1[1] == buffer2[1]) {
                saveCurrentMessage = false
                break
            }
        }
    }

    // serial.writeLine("saveCurrentMessage: " + saveCurrentMessage)
    // serial.writeLine("saveCurrentCommand: " + saveCurrentCommand)
    // serial.writeLine("isCommand: " + isCommand)

    if (saveCurrentCommand && isCommand) {
        serial.writeLine("buffer1[3]: " + buffer1[3])
        if (parseInt(buffer1[3]) == 1) { //on lockdown
            serial.writeLine("i am a lockdown")
            if (parseInt(buffer1[2]) == 1) { //local
                serial.writeLine("i am a local lockdown")
                localLockDown = true;
            } else { //global
                globalLockDown = true;
            }
        } else if (parseInt(buffer1[3]) == 0) { //off lockdown
            if (parseInt(buffer1[2]) == 1) { //local
                localLockDown = false;
            } else {//global
                globalLockDown = false;
            }
        }
        radio.sendString(receivedString)
        commandHistory.push(receivedString);
    } else if (saveCurrentMessage && !isCommand) {
        let hopsRcv = parseInt(buffer1[2]);
        if (hopsRcv == 1 && parseInt(buffer1[3]) >= 38) {
            personalWarning = true;
        }
        hopsRcv += 1;
        let newStr = buffer1[0] + "," + buffer1[1] + "," + hopsRcv + "," + buffer1[3] + "," + buffer1[4];
        radio.sendString(newStr)
        rxMessagesHistory.push(newStr)
        serial.writeLine("RX: " + newStr)
    }
})

input.onButtonPressed(Button.A, function () {
    serial.writeLine("Button A is pressed")
    ifTransmit = !ifTransmit
})

input.onButtonPressed(Button.B, function () {
    serial.writeLine("Button B is pressed")
    clearTrash = !clearTrash
})


let messageCounter: number = 0;
let rxMessagesHistory: string[] = [];
let buffer1: string[]
let buffer2: string[]
let commandHistory: string[] = [];
let personalWarning = false;
let localLockDown = false;
let globalLockDown = false;
let randomWaitPeriod = 0
let saveCurrentMessage = true;
let saveCurrentCommand = true;
let ifTransmit = false;
let hops = 1;
let originalGroup = 9;// to change
let clearTrashTime = input.runningTime();
let clearTrash = false;
radio.setTransmitSerialNumber(true)
radio.setTransmitPower(2)
basic.showIcon(IconNames.Yes)
serial.writeLine("")
serial.writeLine("")
serial.writeLine("")
serial.writeLine("Node Device: " + control.deviceName())
basic.forever(function () {
    basic.pause(1000)
    if (ifTransmit) {
        radio.setGroup(originalGroup)
        messageCounter += 1;
        let str = messageCounter + "," + control.deviceName() + "," + hops + "," + input.temperature() + "," + originalGroup;
        radio.sendString(str)
        rxMessagesHistory.push(str);
        serial.writeLine("TX: " + str + " to group: " + originalGroup)
    } else {
        basic.showIcon(IconNames.Asleep)
    }
    checkLEDs(input.temperature());
    if (clearTrash) {
        if (input.runningTime() - clearTrashTime > 20000) {
            serial.writeLine("clearing trash...")
            serial.writeLine("")
            rxMessagesHistory = [];
            commandHistory = [];
            clearTrashTime = input.runningTime();
        }
    }
})

function checkLEDs(t: number) {
    basic.clearScreen()
    let temp = t - 30;
    let checkCond = false;
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 5; j++) {
            led.plot(i, j);
            // serial.writeLine("before temp is: " + temp)
            temp -= 1;
            // serial.writeLine("before temp is: " + temp)
            if (temp <= 0) {
                // serial.writeLine("i,j,temp=" + i + "," + j + "," + temp)
                checkCond = true;
                break;
            }
        }
        if (checkCond) {
            break;
        }
    }


    if (localLockDown) {
        for (let i = 3; i < 4; i++) {
            for (let j = 0; j < 5; j++) {
                led.plot(i, j);
            }
        }
    }
    if (globalLockDown) {
        for (let i = 4; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                led.plot(i, j);
            }
        }
    }
    if (personalWarning) {
        for (let i = 2; i < 3; i++) {
            for (let j = 0; j < 5; j++) {
                led.plot(i, j);
            }
        }
    }
    // personalWarning = false;




    // if (localLockDown && globalLockDown && personalWarning) {
    //     basic.clearScreen()



    //     basic.showLeds(`
    //         . . # # #
    //         . . # # #
    //         . . # # #
    //         . . # # #
    //         . . # # #
    //         `)
    // } else if (localLockDown && globalLockDown) {
    //     basic.showLeds(`
    //         . . . # #
    //         . . . # #
    //         . . . # #
    //         . . . # #
    //         . . . # #
    //         `)
    // } else if (localLockDown && personalWarning) {
    //     basic.showLeds(`
    //         . . # # .
    //         . . # # .
    //         . . # # .
    //         . . # # .
    //         . . # # .
    //         `)
    // } else if (globalLockDown && personalWarning) {
    //     basic.showLeds(`
    //         . . # . #
    //         . . # . #
    //         . . # . #
    //         . . # . #
    //         . . # . #
    //         `)
    // } else if (localLockDown) {
    //     // serial.writeLine("i am a local lockdown")
    //     basic.showLeds(`
    //         . . . # .
    //         . . . # .
    //         . . . # .
    //         . . . # .
    //         . . . # .
    //         `)
    // } else if (globalLockDown) {
    //     basic.showLeds(`
    //         . . . . #
    //         . . . . #
    //         . . . . #
    //         . . . . #
    //         . . . . #
    //         `)
    // } else if (personalWarning) {
    //     basic.showLeds(`
    //         . . # . .
    //         . . # . .
    //         . . # . .
    //         . . # . .
    //         . . # . .
    //         `)
    // }
}

function plotTemp(t: number) {

}




