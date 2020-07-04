import sqlite3
import requests
import socket

localLockdown = False
globalLockdown = False
ip_address = **your IP**

def getData():
	
	temperatures = []
	
	conn = sqlite3.connect('temperature.db')
	c = conn.cursor()
	sql = 'SELECT trackername, AVG(temp) AS averagetemp FROM temperature GROUP BY trackername ORDER BY trackername ASC'
	altSQL = "SELECT trackername, temp AS averagetemp, MAX(timestamp) AS timestamp, deviceid, isintruder, radioGroup FROM temperature GROUP BY trackername"
	c.execute(altSQL)
	results = c.fetchall()
	print(results)
	for result in results:
				
		temperatures.append({'trackername':result[0],'averagetemp':result[1],'timestamp':result[2],'deviceid':result[3],'isintruder':result[4],'radioGroup':result[5]})
	
	conn.close()
	
	return temperatures	
	
def getEvent():
	
	temperatures = []
	
	conn = sqlite3.connect('temperature.db')
	c = conn.cursor()
	altSQL = "SELECT trackername, timestamp, deviceid, event, radioGroup FROM event"
	c.execute(altSQL)
	results = c.fetchall()
	print(results)
	for result in results:
				
		temperatures.append({'trackername':result[0],'timestamp':result[1],'deviceid':result[2],'event':result[3],'radioGroup':result[4]})
	
	conn.close()
	
	return temperatures	

def activatelocallockdown(radioGroup):
	global localLockdown
	localLockdown = True
	# rhub.py will call. Then here, we will notify cloud
	req = requests.get("http://"+ ip_address +"/api/activatelocallockdown/"+radioGroup) #calling cloud

def deactivatelocallockdown():
	global localLockdown
	localLockdown = False
	# cloud will call. Then here we will set localLockdown to false. rhub will keep calling getLocalStatus()
	
def activategloballockdown():
	global globalLockdown
	globalLockdown = True
	# cloud will call. Then here we will set globalLockdown to true. rhub will keep calling getGlobalStatus()

def deactivategloballockdown():
	global globalLockdown
	globalLockdown = False	  
	# cloud will call. Then here we will set globalLockdown to false. rhub will keep calling getGlobalStatus()
	
	
def getLocalStatus():	 
	global localLockdown
	return localLockdown

def getGlobalStatus():
	global globalLockdown
	return globalLockdown

def handshake(radioGroup):
	myIP = get_ip_address()
	requests.get("http://"+ ip_address +"/api/handshake/"+radioGroup+"/"+myIP) #calling cloud

def get_ip_address():
	ip_address = ''
	s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	s.connect(("8.8.8.8",80))
	ip_address = s.getsockname()[0]
	s.close()
	return ip_address	