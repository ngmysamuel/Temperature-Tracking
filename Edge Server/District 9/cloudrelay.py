import time
import sqlite3
import requests
import json



try:
	conn = sqlite3.connect('temperature.db')
	
	base_uri = 'http://192.168.1.111:5000/'
	globaltemperature_uri = base_uri + 'api/postData'
	globalevent_uri = base_uri + 'api/postEvent'
	headers = {'content-type': 'application/json'}
	
	
	
	while True:
	
		time.sleep(5)
		
		print('Relaying data to cloud server...')
				
		c = conn.cursor()
		c.execute('SELECT prime_key, trackername, temp, radioGroup, timestamp, isintruder, deviceid FROM temperature WHERE tocloud = 0')
		results = c.fetchall()
		c = conn.cursor()
				
		for result in results:
					
			print('Relaying prime_key={}; trackername={}; temp={}; radioGroup={}; timestamp={}; isintruder={}; deviceid={}'.format(result[0], result[1], result[2], result[3], result[4], result[5], result[6]))
			
			gtemp = {
				'trackername':result[1],
				'temp':result[2],
                'radioGroup':result[3],
				'timestamp':result[4],
				'isintruder':result[5],
				'deviceid':result[6]
			}
			req = requests.post(globaltemperature_uri, headers = headers, data = json.dumps(gtemp))
			
			c.execute('UPDATE temperature SET tocloud = 1 WHERE prime_key = ' + str(result[0]))


		c.execute('SELECT prime_key, trackername, radioGroup, timestamp, event, deviceid FROM event WHERE tocloud = 0')
		results = c.fetchall()
		c = conn.cursor()
				
		for result in results:
					
			print('Relaying prime_key={}; trackername={}; radioGroup={}; timestamp={}; event={}; deviceid={}'.format(result[0], result[1], result[2], result[3], result[4], result[5]))
			
			gtemp = {
				'trackername':result[1],
                'radioGroup':result[2],
				'timestamp':result[3],
				'event':result[4],
				'deviceid':result[5]
			}
			req = requests.post(globalevent_uri, headers = headers, data = json.dumps(gtemp))
			
			c.execute('UPDATE event SET tocloud = 1 WHERE prime_key = ' + str(result[0]))	
		
		conn.commit()



except KeyboardInterrupt:
	
	print('********** END')
	
except Error as err:

	print('********** ERROR: {}'.format(err))

finally:

	conn.close()
