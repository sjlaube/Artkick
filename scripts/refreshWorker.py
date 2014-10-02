from pymongo import Connection
import pymongo
import string
import httplib, urllib, urllib2
import re, urlparse
import time
from datetime import datetime
import json
import cStringIO
import Queue
import threading


if True:
  c_server = 'ds047539-a0.mongolab.com'
  c_port = 47539
  c_db_name = 'heroku_app24219881'
  c_username = 'artCoder'
  c_password = 'zwamygogo'
else:
  c_server = 'ds053468-a0.mongolab.com'
  c_port = 53468
  c_db_name = 'heroku_app16778260'
  c_username = 'artCoder'
  c_password = 'zwamygogo'

lastUpdate = -1  #timestamp
tarHour = 5 #3am eastern time


u_server = 'ds063698-a0.mongolab.com'
u_port = 63698
u_db_name = 'heroku_app18544527'
u_username = 'artCoder'
u_password = 'zwamygogo'

baseUrl = "http://frozen-badlands-7283.herokuapp.com/search"




def utcMilli():
    return int(round(time.time() * 1000))


def scan(u_db, c_db):
    #get a token
    user = u_db.users.find({'email':'leon@artkick.com'})[0]
    token = user['tokens'][0]
    print token
         
    lists = []
    for listObj in c_db.viewlists.find({'public_search':True},{'id':1,'name':1,'searchTerm':1,'categories':1}):
        if len(listObj['categories']) >0:
          lists.append(listObj)
        else:
          c_db.viewlists.remove({'id':listObj['id']})  #clear the viewlist
       

    for list in lists:
        #print 'processing',list['name']
        #print list['id'], list['searchTerm']
        queryStr = "email=leon@artkick.com&token="+token+"&listId="+str(list['id'])+"&artkick_db=stag"+"&category="+list['categories'][0]
        for key in list['searchTerm']:
           if list['searchTerm'][key]!= None:
               if key == 'query':
                  queryStr += "&keyword="+list['searchTerm'][key]
               else:
                  queryStr += "&"+key+"="+list['searchTerm'][key]
        url = baseUrl+"?"+queryStr
        print url
        result = urllib.urlopen(url)
        print list['name'], result.read()



def main():
    c_conn = Connection(c_server, c_port)
    c_db = c_conn[c_db_name]
    c_db.authenticate(c_username, c_password)
    
    u_conn = Connection(u_server, u_port)
    u_db = u_conn[u_db_name]
    u_db.authenticate(u_username, u_password)

    lastUpdate = utcMilli()  #this is optional
    #scan(u_db, c_db)
    #c_conn.close()
    #u_conn.close()
    
    lastWake = utcMilli()
    while True:
       currHour = datetime.now().hour
       print currHour
       
       
       
       currMilli = utcMilli()
       if currHour == tarHour and currMilli - lastUpdate > 5*3600*1000:
          #do something
          print 'start refreshing...'
          lastUpdate = currMilli
          scan(u_db, c_db)
       
       elif currMilli - lastWake > 10*60*1000:
          #wake it up
          print 'waking up the service...'
          lastWake = currMilli
          result = urllib.urlopen(baseUrl)
          print result.read()
        
       time.sleep(10)





if __name__ == "__main__":
    main()