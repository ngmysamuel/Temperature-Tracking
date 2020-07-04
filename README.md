# Temperature tracking!

Picture this scenario: 

A pandemic has reached the shore of Panem. The President has ordered a lockdown. All the inhabitants in the outlying Districts are to be quarantined within their own District and tagged with a tracker. 

Each District has an edge processor that is to be operated by the local Peacekeepers to track the temperature of the inhabitants. The Capitol itself will host a cloud server that is capable of collating all the tracking information and provide the President with a global view of the inhabitants across the districts

cr. Prof Tan Wee Kek


# How to run

Due to the nature of the project (multiple devices), the setting up process can be quite involved. Obviously the repo should be cloned to somewhere on your computer already (eg. your Desktop)

## Setting up the cloud server

 1. Ensure you have the packages mysqlclient, 
Flask, Flask-Cors, Connexion installed. 
> pip install mysqlclient <br>
> pip install Flask<br>
> pip install Flask-Cors<br>
> pip install Connexion<br>
2. You will have to create a database in mysql. You refer to the docs on how to do that. Use the two create table commands in `mysql commands.txt` to create the two tables. 
3. Ensure you have updated`data.py` in `Cloud Server` which contains the credentials for connection to your mysql database
4. Run `py server.py`
5. By default, it will open a server at localhost:5000. 

## Edge Server

I have provided 2 folders in the `Edge Server` folder to better explain what this system is able to do. Each folder represents a different "district" but the code is essentially the same. You  can repeat the instructions below on the 2 Raspberry Pi's. The files in each district should already be in their respective Pi's. 

1. Open `temperature.py` and `cloudrelay.py` to edit the variable `ip_address` to the IP where your cloud server is running.

2. Note the you will need python >= 3.6 to run the following command. 
> sudo pip install -U flask-cors” 

3. Install sqlite
>sudo apt-get install sqlite3

4. Open the command line and type the following to enter the sqlite cli.
>  sqlite3 temperature.db
5. Open `sqlite commands.txt` found in the root folder and run the first 2 create table commands. (crtl + c to exit sqlite cli)

7. Run the following commands. Ensure the variable “originalGroup” in rhub.py matches the district it is in
>python3.6 edge.py  <br>
>python3 rhub.py <br>
>python3 cloudrelay.py<br>

8. Navigate to localhost:5000



## Nodes

Similar to the how the edge server is, I have provided 2 folders in the `Node device` folder to better explain what this system is able to do. 
1. Decide on one microbit that is to be your controller. Load `controller.js` into it. 

2. Connect this microbit to the Pi. 
3. This microbit will only scan districts that you have indicated in the variable `allIndex`. For example, if the controller is in district 8, `allIndex` will contain district 9 i.e. treats inhabitants from district 9 as intruders, `var allIndex = [9].`
4. On seeing a “tick” symbol, press [A]. You will see a heart. This signifies it is running the intruder detection algorithm. Then press [B] to start its garbage collection service. You have to press 2 different buttons so that is easier to debug and finely control what the microbit is doing
5. Load inhabitant.js into node microbit
6. This node can be anywhere within range. The variable `originalGroup` variable has to match the district it is in
7. You will see a “tick” symbol. It will transition to alternating between a “sleepy” symbol (-_-) and the actual statuses screen. Press [B]. Then press [A] to start transmitting temperature, it will stop alternating and will only show the actual statuses screen. This signifies that it is transmitting its temperature. 

## Lights

GPIO pins are: 
>green pin = 7<br>
>red pin = 11<br>
>blue pin = 13<br>

# Notes

1.  It is best to keep the microbits  transmitting

2. Intruder alarm (blue led) has been configured such that it will light up when it detects intruder and after two cycle of intruder detection without intruders being detected, it will turn itself off.

3.  If at times you see a local / global command sent from the cloud is not being reflected on the nodes, please restart the cloud server, edge server, then the rhub.py script in that order so that it can handshake again with the cloud server. The cloud server log should show the pair of ip addresses to the districts when its handshake api is called

4. The microbit contains a record all previous messages received and sent. This is because the nodes are based on a relay system which enables devices outside of the range of the controller to also be able to send back their information. Pressing [B] starts garbage collection to delete off the history.

5. Webpages run off pure HTML + JS

6. `cloudrelay.py` is a standalone program that just passes data to your cloud’s data base.

7. `rhub.py` is the brain of the raspberry Pi, setting the lights and persisting the received information into the local database. It will also call APIs in the local server, `edge.py`. It will constantly poll for status of the lockdowns as well. If there is a change, it will send out a command message to the microbits

## Details

### Web page

|     Buttons                           | What does it do?                                                                                                                   |
|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
|     Refresh                           |     Gets the latest data from mysql database                                                                                       |
|     Refresh Status                    |     Clicking on the de/activation buttons will auto update the status.   But if it comes from edge, please click refresh status    |
|     De / activate Global Lockdown*    |     De/activates the global lockdown                                                                                               |
|     Deactivate local lockdown*        |     Please fill the correct district you wish to deactivate the   local lockdown for in the input box to the right of it           |
|                                       |                                                                                                                                    


|     Labels                            | What does it mean?                                                                                                                                                                                                                                                                               |
|---------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|     Global Lockdown status            |     Reflects the status of the global lockdown                                                                                                                                                                                                                                                   |
|     Local Lockdown status             |     In the format of      {“district number”:isItUnderLockdown}  <br>   <br>  Eg. I have District 8 and 9. <br>  <br>  {“9”:false} means District 9 is not under lockdown <br> {} means no districts are facing a local lockdown.  <br>   {“8”:true} means District 8 is under lockdown and District 9 is not.    |
|     De / activate Global Lockdown*    |     De/activates the global lockdown                                                                                                                                                                                                                                                             |
|     Deactivate local lockdown*        |     Please fill the correct district you wish to deactivate the   local lockdown for in the input box to the right of it                                                                                                                                                                         |
|                                       |                                                                                                                                                                                                                                                                                                  |

\*disabled for edge servers

### API 

#### (Edge)


| Name of method                  | What does it do?                                                                                                                                                                                            |
|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|     getLocalStatus              |     Works with activateLocalLockdown and   deactivateLocalLockdown     This api is constantly being called by   rhub to refresh rhub’s status in case the cloud has changed the lock down   status          |
|     activateLocalLockdown       |     Activation of local lockdown is called   by rhub which will in turn call the API on the cloud.                                                                                                          |
|     deactivateLocalLockdown     |     Deactivation of local lockdown is   called by the cloud.                                                                                                                                                |
|     getGlobalStatus             |     Works with activateGlobalLockdown and   deactivateGlobalLockdown.     This api is constantly being called by   rhub to refresh its status in case the cloud has changed the lock down status            |
|     activateGlobalLockdown      |     Activation of global lockdown is   called by cloud.                                                                                                                                                     |
|     deactivateGlobalLockdown    |     Deactivation of local lockdown is   called by the cloud.                                                                                                                                                |
|     getData                     |     Called by the web page to get   temperature data                                                                                                                                                        |
|     getEvent                    |     Called by the web page to get event   data                                                                                                                                                              |
|     Handshake                   |     See point 3 below                                                                                                                                                                                       |

#### Cloud

| Name of method                  | What does it do?                                                                                                                                              |
|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
|     getData                     |     Called by the web page to get   temperature data                                                                                                          |
|     getEvent                    |     Called by the web page to get event   data                                                                                                                |
|     postData                    |     Called by cloud relay to persist data   into the cloud database                                                                                           |
|     postEvent                   |     Called by cloud relay to persist data   into the cloud database                                                                                           |
|     activateLocalLockdown       |     This is called by the edge’s “Activatelocallockdown”   API when it detect the high temperature. To update the cloud mainly                                |
|     deactivatelocallockdown     |     The web page calls this; taking into   account the radio group passed in to call the correct IP to deactivate   lockdown.                                 |
|     activategloballockdown      |     Will loop through the map of IP   addresses to radio groups to send a message to every district that there is   global lockdown                           |
|     deactivategloballockdown    |     Will loop through the map of IP   addresses to radio groups to send a message to every district that there is a   lifting of the global lockdown          |
|     getAllLocalStatus           |     Called by the web page and returns the   map                                                                                                              |
|     getGlobalStatus             |     Called by the web page and returns the   Boolean                                                                                                          |
|     handshake                   |     Called by the edge’s “Handshake”.   Populates the map with IP to radio group. Works with local server’s   handshake.                                      |
<br>
<br>
<br>
<br>

1.	Microbits communicate via strings. Generally, they are in the format: messageCounter, deviceName, hops, temp, radioGroup for temperature messages. And commandcount, lockdown, typeoflockdown, offOrOn for command messages. 

2.	The controller microbit decides who is an intruder and will modify the temperature messages it passes to the edge processor to signify as such. Which enables the rhub.py to simply look if the string contains “INTRU” or not to trigger the blue light


3.	It is possible to turn off a local alarm by district. This utilises a map on the cloud server to remember each district’s IP address to its radio group. The rhub.py initialises a handshake with the cloud server. This process populates the map automatically with the edge’s IP address. Because the cloud knows which IP to direct it shutdown call, we are able to locally shutdown alarms. 


4.	The intruder detection is done within the forever loop. If total time since the last intruder detection run exceeds a certain amount (20s), it will start up a new run. And within every intruder detection run, it will change the radio group it is scanning for every few seconds (2s). Upon completion of the run and there is still time before the next run is scheduled, it will scan within its home radio group to pick up the signals. 





