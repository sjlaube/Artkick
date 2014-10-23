from pymongo import Connection
import pymongo
import string
import urllib
import csv


server = 'ds063698-a0.mongolab.com'
port = 63698
db_name = 'heroku_app18544527'
username = 'artCoder'
password = 'zwamygogo'




def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    #print db.viewlist_records.count()
    
    outFile = open('user_trace.csv','w')
    writer = csv.writer(outFile)
    writer.writerow(["email","viewlist","time_stamp(utc millis)","ip_address"])
    num = 0
    for listRec in db.viewlist_records.find(timeout=False):
         num += 1
         print num, listRec['email']
         writer.writerow([listRec['email'],listRec['viewlist'],listRec['time_stamp'], listRec['ip_address']])
    db.viewlist_records.remove()
    outFile.close()
    conn.close()
    
    
if __name__ == "__main__":
    main()