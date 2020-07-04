from datetime import datetime
from flask import make_response, abort
import json
import MySQLdb
import MySQLdb.cursors
import requests

#change the variables here to use your own database (probably: user,passwd and db)
#I am also using the table: checkingaccount. So you will need to change the SQL querys below as well.
conn = MySQLdb.connect(user="root", passwd="root", host="localhost",
					   db="test", cursorclass=MySQLdb.cursors.DictCursor)
					   
localLockdown = False
allLocalLockdown = {}
globalLockdown = False
radioGroupToIp = {}

def getData():
	global conn
	try:
		with conn.cursor() as cursor:
			cursor.execute("SELECT trackername, temp AS averagetemp, MAX(timestamp), deviceid, isintruder, radioGroup FROM temperature GROUP BY trackername")
			data = cursor.fetchall()
			print(data)
			#Depending on how we want to form the tables, this for loop will have to change to format the data (into {key:value}) we get from DB
			for r in data:
				timestamp = str(r["MAX(timestamp)"])
				r["timestamp"] = timestamp
				del r["MAX(timestamp)"]
				averagetemp = str(r["averagetemp"])
				r["averagetemp"] = averagetemp
				print()
			# #this makes the resulting formatted data into an actual JSON string array
			data = str(data)
			data = data.replace("'", '"')
			data = data.strip("()")
			data = "["+data+"]"
			if data[-2:-1] == ",":
				data = data[:-2] + data[-1:]
			print("Data is: {}".format(data))
			return data

	finally:
		print()
		# conn.close()

def getEvent():
	global conn
	try:
		with conn.cursor() as cursor:
			cursor.execute("SELECT trackername, timestamp, deviceid, event, radioGroup FROM event")
			data = cursor.fetchall()
			print(data)
			#Depending on how we want to form the tables, this for loop will have to change to format the data (into {key:value}) we get from DB
			for r in data:
				timestamp = str(r["timestamp"])
				r["timestamp"] = timestamp
				print()
			# #this makes the resulting formatted data into an actual JSON string array
			data = str(data)
			data = data.replace("'", '"')
			data = data.strip("()")
			data = "["+data+"]"
			# print(data[-2:-1])
			# print("data[:-2] == , is {}".format(data[-2:-1] == ","))
			if data[-2:-1] == ",":
				data = data[:-2] + data[-1:]
			print("Data is: {}".format(data))
			return data

	finally:
		print()
		# conn.close()

def postData(globaltemperature):
	'''
	This function creates a new temperature record in the database
	based on the passed in temperature data
	:param globaltemperature:  Global temperature record to create in the database
	:return:		200 on success
	'''
	trackername = globaltemperature.get('trackername', None)
	temp = globaltemperature.get('temp', None)
	timestamp = globaltemperature.get('timestamp', None)
	radioGroup = globaltemperature.get('radioGroup', None)
	deviceid = globaltemperature.get('deviceid', None)
	isintruder = globaltemperature.get('isintruder', None)

	try:
		with conn.cursor() as cursor:
			sql = 'INSERT INTO temperature (trackername, temp, radioGroup, deviceid, isintruder, timestamp) VALUES (%s, %s, %s, %s, %s, %s)'
			val = (trackername, temp, radioGroup, deviceid, isintruder, timestamp)
			cursor.execute(sql, val)
			print(cursor.rowcount, 'record inserted.')
			conn.commit()
			#passing back the new list of data
			data = getData()
			return data

	finally:
		print()

	return make_response('Global temperature record successfully created', 200)

def postEvent(globaltemperature):
	'''
	This function creates a new temperature record in the database
	based on the passed in temperature data
	:param globaltemperature:  Global temperature record to create in the database
	:return:		200 on success
	'''
	trackername = globaltemperature.get('trackername', None)
	timestamp = globaltemperature.get('timestamp', None)
	radioGroup = globaltemperature.get('radioGroup', None)
	deviceid = globaltemperature.get('deviceid', None)
	event = globaltemperature.get('event', None)

	try:
		with conn.cursor() as cursor:
			sql = 'INSERT INTO event (trackername, radioGroup, deviceid, event, timestamp) VALUES (%s, %s, %s, %s, %s)'
			val = (trackername, radioGroup, deviceid, event, timestamp)
			cursor.execute(sql, val)
			print(cursor.rowcount, 'record inserted.')
			conn.commit()
			#passing back the new list of data
			data = getData()
			return data

	finally:
		print()

	return make_response('Global temperature record successfully created', 200)	

def activatelocallockdown(radioGroup):
	global localLockdown
	global allLocalLockdown
	localLockdown = True
	allLocalLockdown[radioGroup] = True
	# called by edge.

def deactivatelocallockdown(radioGroup):
	global localLockdown
	global allLocalLockdown
	global radioGroupToIp
	localLockdown = False
	# html will call. Then we will call edge api here
	ipToCall = radioGroupToIp[radioGroup]
	allLocalLockdown[radioGroup] = False
	req = requests.get("http://"+ipToCall+":5000/api/deactivatelocallockdown") #calling the edge
	print("http://"+ipToCall+":5000/api/deactivatelocallockdown")
	
def activategloballockdown():
	global globalLockdown
	globalLockdown = True
	# html will call. Then we will call edge api here
	for key in radioGroupToIp:
		ipToCall = radioGroupToIp[key]
		req = requests.get("http://"+ipToCall+":5000/api/activategloballockdown") #calling the edge
	# req = requests.get("http://192.168.1.97:5000/api/activategloballockdown") #calling the edge

def deactivategloballockdown():
	global globalLockdown
	globalLockdown = False    
	# html will call. Then we will call edge api here
	for key in radioGroupToIp:
		ipToCall = radioGroupToIp[key]
		req = requests.get("http://"+ipToCall+":5000/api/deactivategloballockdown") #calling the edge
	# req = requests.get("http://192.168.1.97:5000/api/deactivategloballockdown") #calling the edge
	
def getLocalStatus():    
	global localLockdown
	return localLockdown

def getAllLocalStatus():
	global allLocalLockdown
	return allLocalLockdown

def getGlobalStatus():
	global globalLockdown
	return globalLockdown    

def handshake(radioGroup, myIp):
	radioGroupToIp[radioGroup] = myIp
	for key in radioGroupToIp:
		print(key, ":",radioGroupToIp[key])













def deleteData(person):
	#person is defined in the parameter in the yml
	global conn
	CHECKINGACCOUNTID = person.get('CHECKINGACCOUNTID', None)
	BALANCE = person.get('BALANCE', None)
	print(BALANCE)
	try:
		with conn.cursor() as cursor:
			sql = 'DELETE FROM checkingaccount WHERE CHECKINGACCOUNTID = %s;'
			val = (CHECKINGACCOUNTID,)
			print(val)
			cursor.execute(sql, val)

			print(cursor.rowcount, 'record deleted.')
			conn.commit()

	finally:
		print()
	#	  conn.close()
