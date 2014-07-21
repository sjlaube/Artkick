from pymongo import Connection
import pymongo
import time


server = 'ds063698-a0.mongolab.com'
port = 63698
db_name = 'heroku_app18544527'
username = 'artCoder'
password = 'zwamygogo'



def main():
    conn = Connection(server, port)
    db = conn[db_name]
    db.authenticate(username, password)
    
    for image in db.gettyImages.find(timeout = False):
       if not 'last_visit' in image:
           print image['id']
           db.gettyImages.update({'id':image['id']},{'$set':{'last_visit':0}})

       if not 'has_highres' in image:
           print image['id']
           db.gettyImages.update({'id':image['id']},{'$set':{'has_highres':False}})

    conn.close()


if __name__ == "__main__":
    main()