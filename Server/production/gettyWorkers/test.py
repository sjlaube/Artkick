from pymongo import Connection
import pymongo
import string
import httplib, urllib, urllib2
import re, urlparse
import time
import json
import Image
from boto.s3.connection import S3Connection
import cStringIO
import Queue
import threading



cart_size = 5
threads = []
imageQueue = Queue.Queue()

class sourceWorker(threading.Thread):
    def __init__(self, threadID, name):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
    
    def run(self):
        print "Starting "+self.name
        count = 0
        global imageQueue
        while count < 100:
            imageQueue.put(count)
            print 'add url', count
            count+=1
            time.sleep(1)

class imageWorker(threading.Thread):
    def __init__(self, threadID, name):
       threading.Thread.__init__(self)
       self.threadID = threadID
       self.name = name

    def run(self):
       print "Starting "+self.name
       while True:
          cart = []
          global imageQueue
          print 'cart_size',cart_size
          print 'imageQueue', imageQueue.qsize()
          while len(cart) < cart_size and imageQueue.qsize() > 0:
            print 'add image to cart', len(cart)
            cart.append(imageQueue.get())

          print len(cart)
          if len(cart) > 0:
              print self.threadID, "downloading image ...", cart
              time.sleep(5)




def main():
    sourceThread = sourceWorker(0,"Source worker")
    threads.append(sourceThread)
    sourceThread.start()
    
    for i in range(3):
       thread = imageWorker(i+1,"Thread"+str(i))
       thread.start()
       threads.append(thread)
    
    for thread in threads:
       thread.join()


    
    

if __name__ == "__main__":
    main()