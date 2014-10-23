class SmugmugController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'
  require 'curb'
  require 'securerandom'
  require 'net/http'
  
  
  require 'cgi'
  require 'base64'
  require 'openssl'


  @@consumer_key = 'nRnEZ428bMzyQ97tDegLYz8E3ktEuGIi'
  @@consumer_secret = 'b6f6349e576d8ce84da1ecc08f3c97c3'
  
  

  @@userDbId = '63'
  @@contentDbId = '47'
  @@privateRange = 10000000000
  @@dbMeta = {}


  @@dbMeta['63'] = {:server => 'ds063698-a0.mongolab.com', :port => 63698, :db_name => 'heroku_app18544527', 
    :username => 'artCoder', :password => 'zwamygogo'}  

  
  @@dbMeta['31'] = {:server => 'ds031948.mongolab.com', :port => 31948, :db_name => 'zwamy', :username => 'leonzwamy', 
    :password => 'zw12artistic'}
  
  @@dbMeta['47'] = {:server => 'ds047539-a0.mongolab.com', :port => 47539, :db_name => 'heroku_app24219881',
  :username => 'artCoder', :password => 'zwamygogo' }
  
  @@dbMeta['53'] = {:server => 'ds053468-a0.mongolab.com', :port => 53468, :db_name => 'heroku_app16778260', 
    :username => 'artCoder', :password => 'zwamygogo'}


    userDbInfo = @@dbMeta[@@userDbId]
    @@userClient = MongoClient.new(userDbInfo[:server],userDbInfo[:port])
    @@userDb = @@userClient[userDbInfo[:db_name]]
    @@userDb.authenticate(userDbInfo[:username],userDbInfo[:password])
    
    contentDbInfo = @@dbMeta[@@contentDbId]
    @@contentClient = MongoClient.new(contentDbInfo[:server],contentDbInfo[:port])
    @@contentDb = @@contentClient[contentDbInfo[:db_name]]
    @@contentDb.authenticate(contentDbInfo[:username],contentDbInfo[:password])

  def utcMillis
    return (Time.new.to_f*1000).to_i
  end
    
  def getListSet(listId)
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
    
     if (not listId.is_a? Numeric) and (listId.include? 'top')
        return @@userDb['privLists'].find({'id'=>listId})
     end
     
     if listId.to_i >= @@privateRange
        return @@userDb['privLists'].find({'id'=>listId.to_i})
     end
     
     return @@contentDb['viewlists'].find({'id'=>listId.to_i})   
  end
  
  
  def getImageSet(imageId)
    
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
     if imageId.to_i >= @@privateRange
        return @@userDb['privImages'].find({'id'=>imageId.to_i})
     end
     
     return @@contentDb['images'].find({'id'=>imageId.to_i})        
         
  end
  
  def getIndex(name)
      names = ['image','privImage','viewlist','privList','user']
      if not names.include? name
        return -1
      end
      
      baseUrl = 'http://pacific-oasis-9960.herokuapp.com/id/'
      url = baseUrl + name
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      request = Net::HTTP::Get.new(uri.request_uri)
      res = http.request(request)
      dic = JSON.parse(res.body)
      if dic['Status'] != 'success'
        return -1
      end
      
      return dic['id'].to_i
  end   
  
  def connectDb
    userDbInfo = @@dbMeta[@@userDbId]
    @@userClient = MongoClient.new(userDbInfo[:server],userDbInfo[:port])
    @@userDb = @@userClient[userDbInfo[:db_name]]
    @@userDb.authenticate(userDbInfo[:username],userDbInfo[:password])
    
    contentDbInfo = @@dbMeta[@@contentDbId]
    @@contentClient = MongoClient.new(contentDbInfo[:server],contentDbInfo[:port])
    @@contentDb = @@contentClient[contentDbInfo[:db_name]]
    @@contentDb.authenticate(contentDbInfo[:username],contentDbInfo[:password])
    
  end
  
  
  def closeDb
    if @@userClient != nil
      @@userClient.close
    end
    
    if @@contentClient != nil
      @@contentClient.close
    end
  end
    

  def smugmug
    
  end
  
  def getSignature2(args, oauthObj)
    # this is a generic oauth signature generator
    #oauthToken = {'token'=>token, 'secret'=>secret} and can be nil if it is for request token
    #parameters are basic key-value pairs for API usage
    
    args['oauth_consumer_key'] = @@consumer_key
    args['oauth_nonce'] = Random.rand(100000).to_s
    args['oauth_signature_method'] = 'HMAC-SHA1'
    args['oauth_timestamp'] = Time.now.to_i.to_s
    args['oauth_version'] = '1.0'
    
    if oauthObj != nil
      args['oauth_token'] = oauthObj['token']
    end
    
    url =  "https://api.smugmug.com/services/api/json/1.3.0/"
    
    
    #sort parameters
    count = 0
    parameters = ''
    args.keys.sort.each do |key|
      if count == 0
         parameters = parameters + key+'='+args[key]
      else
         parameters = parameters + '&'+key+'='+args[key]
      end
      count += 1
    end 
    
    
    base_string = 'GET&' + CGI.escape(url) + '&' + CGI.escape(parameters)
    secretToSign = @@consumer_secret+'&'
    if oauthObj != nil
       secretToSign += oauthObj['secret']
    end
    oauth_signature = CGI.escape(Base64.encode64("#{OpenSSL::HMAC.digest('sha1',secretToSign, base_string)}").chomp)
    testable_url = url +'?'+ parameters + '&oauth_signature=' + oauth_signature
    return testable_url
    
  end
  
  
  def getSignature(method, consumer_key, consumer_secret, token_secret, oauth_token)
     oauth_consumer_key = consumer_key
     oauth_nonce = Random.rand(100000).to_s
     puts oauth_nonce
     oauth_signature_method = 'HMAC-SHA1'
     oauth_timestamp = Time.now.to_i.to_s
     puts oauth_timestamp
     oauth_version = '1.0'
 
     url =  "https://api.smugmug.com/services/api/json/1.3.0/"
 
     parameters = 'method='+
                  method+
                '&oauth_consumer_key=' +
                oauth_consumer_key +
                '&oauth_nonce=' +
                oauth_nonce +
                '&oauth_signature_method=' +
                oauth_signature_method +
                '&oauth_timestamp=' +
                oauth_timestamp 
              
     if method != 'smugmug.auth.getRequestToken'    
       parameters += '&oauth_token='+oauth_token
     end     
              
     parameters += '&oauth_version=' +
                oauth_version 
 
     base_string = 'GET&' + CGI.escape(url) + '&' + CGI.escape(parameters)
     puts base_string
     puts Base64.encode64("#{OpenSSL::HMAC.digest('sha1',consumer_secret+'&'+token_secret, base_string)}")
                     
     oauth_signature = CGI.escape(Base64.encode64("#{OpenSSL::HMAC.digest('sha1',consumer_secret+'&'+token_secret, base_string)}").chomp)
 
     puts oauth_signature
     testable_url = url +'?'+ parameters + '&oauth_signature=' + oauth_signature
     puts testable_url
     return testable_url
  end
  
  def getAuthLink
    
      if(params[:email]==nil or params[:email].strip=='')
         result = {"Status"=>"failure", "Message"=>"email is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end
    

      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
      
      userObj = userSet.to_a[0]
      
      #method = 'smugmug.auth.getRequestToken'
      #url = getSignature(method, @@consumer_key, @@consumer_secret, '', '')
      args = {}
      args['method'] = 'smugmug.auth.getRequestToken'
      url = getSignature2(args,nil)
      
      
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      request = Net::HTTP::Get.new(uri.request_uri)
      res = http.request(request)
      dic = JSON.parse(res.body)
      puts dic['stat']
      
      
      if dic['stat'] != 'ok'
         result = {"Status"=>"failure", "Message"=>"Smugmug API error!"}

         render :json=>result, :callback => params[:callback]
         return
      end
      
      oauth_token = dic['Auth']['Token']['id']
      token_secret = dic['Auth']['Token']['Secret']
      puts oauth_token
      puts token_secret  
      
      
      requestToken = {'token'=>oauth_token, 'secret'=>token_secret}
      @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'smugmug_request_token'=>requestToken}})
      
      authLink = "https://secure.smugmug.com/services/oauth/authorize.mg?Access=Read&Permissions=Public&oauth_token="+oauth_token
      result = {"Status"=>"success", "authLink"=>authLink}

      render :json=>result, :callback => params[:callback]
  end
  
  
  def completeAuth
      if(params[:email]==nil or params[:email].strip=='')
         result = {"Status"=>"failure", "Message"=>"email is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end


      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email','smugmug_request_token']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
      
      userObj = userSet.to_a[0]
      
      if userObj['smugmug_request_token'] == nil
          result = {"Status"=>"failure","ErrorCode"=>1, "Message"=>"no request token, please get the request token from Smugmug!"}

          render :json=>result, :callback => params[:callback]
          return
      end
         
      #method = 'smugmug.auth.getAccessToken'
      #url = getSignature(method, @@consumer_key, @@consumer_secret, userObj['smugmug_request_token']['secret'], userObj['smugmug_request_token']['token'])
      
      args = {}
      args['method'] = 'smugmug.auth.getAccessToken'
      url = getSignature2(args,userObj['smugmug_request_token'])
      
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      request = Net::HTTP::Get.new(uri.request_uri)
      res = http.request(request)
      dic = JSON.parse(res.body)
      puts dic
      
      if dic['stat']!= 'ok'
          result = {"Status"=>"failure", "Message"=>dic}
          @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'smugmug_request_token'=>nil}})

          render :json=>result, :callback => params[:callback]
          return
      end
      
      
      accessToken = dic['Auth']['Token']
      smugmugUser = dic['Auth']['User']
      
      @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'smugmug_access_token'=>accessToken, 'smugmug_user'=>smugmugUser}})

      result = {"Status"=>"success", "accessToken"=>accessToken, "smugmugUser"=>smugmugUser}
      render :json=>result, :callback => params[:callback]

         
         
    
  end
  
  
  
  def checkAuthStatus
      # check if a user has auth token, this does not guarantee the token is sitll valid!
      if(params[:email]==nil or params[:email].strip=='')
         result = {"Status"=>"failure", "Message"=>"email is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end
      


      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email','smugmug_access_token']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
      

      userObj = userSet.to_a[0]
      if userObj['smugmug_access_token'] == nil
          result = {"Status"=>"failure", "Message"=>"the user has no auth token!"}
      else
          result = {"Status"=>"success", "Message"=>"the user has auth token!"}
      end
      render :json=>result, :callback => params[:callback]
      
      
  end
  
  
  
   def findAlbums
      # check if a user has auth token, this does not guarantee the token is still valid!
      if(params[:email]==nil or params[:email].strip=='')
         result = {"Status"=>"failure", "Message"=>"email is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end
      


      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email','smugmug_access_token']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
     
      userObj = userSet.to_a[0]
      if userObj['smugmug_access_token'] == nil
          result = {"Status"=>"failure", "Message"=>"the user has no auth token!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      
      oauthObj = {}
      oauthObj['token'] = userObj['smugmug_access_token']['id']
      oauthObj['secret'] = userObj['smugmug_access_token']['Secret']
      
      sResult = getAlbums(oauthObj)
      if sResult['Status'] == 'failure'
          #@@userDb['users'].update({"email"=>(params[:email].strip).downcase},{'$set'=>{'smugmug_access_token'=>nil}})

          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"smugmug oauth error!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      render :json=>sResult, :callback => params[:callback]
      
  end 
  
  def fetchImages
      if(params[:email]==nil or params[:email].strip=='')
         result = {"Status"=>"failure", "Message"=>"email is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end
      
      if(params[:id]==nil or params[:id].strip=='')
         result = {"Status"=>"failure", "Message"=>"album id is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end
      
      if(params[:key]==nil or params[:key].strip=='')
         result = {"Status"=>"failure", "Message"=>"album key is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end   
      
      
      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email','smugmug_access_token']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
     
      userObj = userSet.to_a[0]
      if userObj['smugmug_access_token'] == nil
          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"the user has no auth token!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      
      oauthObj = {}
      oauthObj['token'] = userObj['smugmug_access_token']['id']
      oauthObj['secret'] = userObj['smugmug_access_token']['Secret']         
      
      sResult =  getImages(oauthObj, params[:id], params[:key])   
      if sResult['Status'] == 'failure'
          #@@userDb['users'].update({"email"=>(params[:email].strip).downcase},{'$set'=>{'smugmug_access_token'=>nil}})
          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"smugmug oauth error!"}
          render :json=>result, :callback => params[:callback]
          return
      end   
      
      render :json=>sResult, :callback => params[:callback]    
      
      
  end
  
  def findAlbum
      # check if a user has auth token, this does not guarantee the token is still valid!
      if(params[:email]==nil or params[:email].strip=='')
         result = {"Status"=>"failure", "Message"=>"email is missing!"}
         render :json=>result, :callback => params[:callback]
         return
      end
      


      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email','smugmug_access_token']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
     
      userObj = userSet.to_a[0]
      if userObj['smugmug_access_token'] == nil
          result = {"Status"=>"failure", "Message"=>"the user has no auth token!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      
      oauthObj = {}
      oauthObj['token'] = userObj['smugmug_access_token']['id']
      oauthObj['secret'] = userObj['smugmug_access_token']['Secret']
      
      sResult = getAlbum(oauthObj)
      if sResult['Status'] == 'failure'
          #@@userDb['users'].update({"email"=>(params[:email].strip).downcase},{'$set'=>{'smugmug_access_token'=>nil}})

          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"smugmug oauth error!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      if sResult['album'] == nil

          result = {"Status"=>"failure", "ErrorCode"=>2, "Message"=>"no album for the user!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      #result = {"Status"=>"success", "album"=>sResult['album']}
      #render :json=>result, :callback => params[:callback] 
      albumMeta = sResult['album'] 
      sResult = getImages(oauthObj, albumMeta['id'].to_s, albumMeta['Key'])   
      
      if sResult['Status'] == 'failure'

          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"smugmug oauth error!"}
          render :json=>result, :callback => params[:callback]
          return        
      end
     
      result = {'Status'=>'success', 'album'=>albumMeta, 'images'=>sResult['album']['Images'], 'imageCount'=>sResult['album']['ImageCount']}
      
      render :json=>result, :callback => params[:callback]  
      
      #iResult = getImage(oauthObj,sResult['album']['Images'][0]['id'].to_s,sResult['album']['Images'][0]['Key'])
      #render :json=>iResult, :callback => params[:callback]  
      
  end
  
  
  def getAlbums(oauthObj)
     # here oauth_token and token_secret mean access token, not the temporal request token
     #method = 'smugmug.albums.get'
     #url = getSignature(method, @@consumer_key, @@consumer_secret, token_secret, oauth_token)
     args = {}
     args['method'] = 'smugmug.albums.get'
     url = getSignature2(args,oauthObj)     
     uri = URI(url)
     http = Net::HTTP.new(uri.host, uri.port)
     http.use_ssl = true
     http.verify_mode = OpenSSL::SSL::VERIFY_NONE
     request = Net::HTTP::Get.new(uri.request_uri)
     res = http.request(request)
     dic = JSON.parse(res.body)
     puts dic   
     if dic['stat'] != 'ok'
       result = {'Status'=>'failure'}
       return result
     end
     
     result = {'Status'=>'success'}
     result['albums'] = dic['Albums']
     
     return result
  end
  
  
  
  def getAlbum(oauthObj)
     # here oauth_token and token_secret mean access token, not the temporal request token
     #method = 'smugmug.albums.get'
     #url = getSignature(method, @@consumer_key, @@consumer_secret, token_secret, oauth_token)
     args = {}
     args['method'] = 'smugmug.albums.get'
     url = getSignature2(args,oauthObj)     
     uri = URI(url)
     http = Net::HTTP.new(uri.host, uri.port)
     http.use_ssl = true
     http.verify_mode = OpenSSL::SSL::VERIFY_NONE
     request = Net::HTTP::Get.new(uri.request_uri)
     res = http.request(request)
     dic = JSON.parse(res.body)
     puts dic   
     if dic['stat'] != 'ok'
       result = {'Status'=>'failure'}
       return result
     end
     
     result = {'Status'=>'success'}
     if dic['Albums'].length > 0
       result['album'] = dic['Albums'][0]
     end
     
     return result
  end
  
  def getImages(oauthObj, albumId, albumKey)
     # here oauth_token and token_secret mean access token, not the temporal request token
     #method = 'smugmug.albums.get'
     #url = getSignature(method, @@consumer_key, @@consumer_secret, token_secret, oauth_token)
     args = {}
     args['method'] = 'smugmug.images.get'
     args['AlbumID'] = albumId
     args['AlbumKey'] = albumKey
     url = getSignature2(args,oauthObj)
     
     uri = URI(url)
     http = Net::HTTP.new(uri.host, uri.port)
     http.use_ssl = true
     http.verify_mode = OpenSSL::SSL::VERIFY_NONE
     request = Net::HTTP::Get.new(uri.request_uri)
     res = http.request(request)
     dic = JSON.parse(res.body)
     puts dic   
     if dic['stat'] != 'ok'
       result = {'Status'=>'failure'}
       return result
     end
     
     result = {'Status'=>'success'}
     result['album'] = dic['Album']
     
     return result
  end  
  
  def getImage(oauthObj, imageId, imageKey)
     # here oauth_token and token_secret mean access token, not the temporal request token
     #method = 'smugmug.albums.get'
     #url = getSignature(method, @@consumer_key, @@consumer_secret, token_secret, oauth_token)
     args = {}
     args['method'] = 'smugmug.images.getInfo'
     args['ImageID'] = imageId
     args['ImageKey'] = imageKey
     url = getSignature2(args,oauthObj)
     
     uri = URI(url)
     http = Net::HTTP.new(uri.host, uri.port)
     http.use_ssl = true
     http.verify_mode = OpenSSL::SSL::VERIFY_NONE
     request = Net::HTTP::Get.new(uri.request_uri)
     res = http.request(request)
     dic = JSON.parse(res.body)
     puts dic   
     if dic['stat'] != 'ok'
       result = {'Status'=>'failure'}
       return result
     end
     
     result = {'Status'=>'success'}
     result['image'] = dic['Image']
     
     return result
  end   
  
  
 def createMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
         
  if params[:listName]==nil or params[:listName].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
  if params[:smugmugId]==nil or params[:smugmugId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no smugmug album id!"}
      render :json=>result, :callback => params[:callback]
      return
  end
   
    #if(params[:token]==nil or params[:token].strip=='')
    #    result = {"Status"=>"failure", "Message"=>"token is missing!"}
    #    render :json=>result, :callback => params[:callback]
    #    return
    #end
    
    
    

    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase})
    #userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    
    
    #overwrite the old one if it exits
    oldListSet = @@userDb['privLists'].find({'smugmug_id'=>params[:smugmugId], 'private_user'=>userObj['email']})  
    if oldListSet.count > 0
      oldListObj = oldListSet.to_a[0]
      #@userDb['users'].update({'email'=>userObj['email']},{'$pull'=>{'private_lists'=>oldListObj['id']}})
      #@userDb['privLists'].remove({'id'=>oldListObj['id']})

      #empty the image array since we are going to import images
      @@userDb['privLists'].update({'id'=>oldListObj['id'].to_i},{'$set'=>{'images'=>[]}})
      listObj = oldListObj
    else 
      currIndex = getIndex('privList')
      if currIndex == -1
         result =  {"Status"=>"failure","Message"=>"ID server not available!"}

         render :json=>result, :callback => params[:callback] 
      end      
      listObj = {'name'=>params[:listName], 'datetime_created'=>Time.now.utc.to_s,
        'id'=>currIndex,'images'=>[], 'private_user'=>userObj['email'], 'smugmug_id'=>params[:smugmugId]}
        
      @@userDb['privLists'].insert(listObj)
      
      if userObj['private_lists'] == nil
         @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
      else
         @@userDb['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
      end
       
    end
      
    

    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>listObj['id'].to_i}

    render :json=>result, :callback => params[:callback] 
 end  
  
 
 
 
 def addImageToViewlist
    # track redudant per user based
   
    # listId, sImageId, sImageKey, email
    # we do not index it for privacy 
    # relations: only image-priv_viewlist, we don't cache it to the category for navigation
   
    if params[:email]==nil or params[:email].length==0
       result = {"Status"=>"failure", "Message"=>"error, no user email!"}
       render :json=>result, :callback => params[:callback]
       return
    end
   
   
         
   if params[:listId]==nil or params[:listId].length==0
       result = {"Status"=>"failure", "Message"=>"error, no viewlist ID!"}
       render :json=>result, :callback => params[:callback]
       return
   end
   
   if params[:sImageId]==nil or params[:sImageId].length==0
       result = {"Status"=>"failure", "Message"=>"error, no smugmug image ID"}
       render :json=>result, :callback => params[:callback]
       return
   end   
   
   if params[:sImageKey]==nil or params[:sImageKey].length==0
       result = {"Status"=>"failure", "Message"=>"error, no smugmug image key"}
       render :json=>result, :callback => params[:callback]
       return
   end  
  

   
   


      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email','smugmug_access_token','smugmug_user']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
     
      userObj = userSet.to_a[0]
      if userObj['smugmug_access_token'] == nil

          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"the user has no auth token!"}
          render :json=>result, :callback => params[:callback]
          return
      end
      
      viewlistSet = @@userDb['privLists'].find({"id"=>params[:listId].to_i})
      if viewlistSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no viewlist found!"}

          render :json=>result, :callback => params[:callback]
          return
      end  
      
      listObj = viewlistSet.to_a[0]
      oauthObj = {}
      oauthObj['token'] = userObj['smugmug_access_token']['id']
      oauthObj['secret'] = userObj['smugmug_access_token']['Secret']   
      sResult = getImage(oauthObj, params[:sImageId].to_s, params[:sImageKey])
      
      if sResult['Status'] == 'failure'

          result = {"Status"=>"failure", "ErrorCode"=>1, "Message"=>"smugmug oauth error!"}
          render :json=>result, :callback => params[:callback]  
          return      
      end
      
      sImageObj = sResult['image']
      #importatnt attrs
      # URLs, url, caption, date/year, artkist
      #render :json=>sImageObj, :callback => params[:callback]  
      
      #Caption, Format, Height, Width, "LastUpdated"
      imageObj = {}
      imageObj['Artist First N'] = userObj['smugmug_user']['NickName']
      imageObj['Artist Last N'] = ' '
      imageObj['Type'] = "Photograph"
      imageObj['smugmug_id'] = sImageObj['id'].to_i
      imageObj['format'] = sImageObj['Format']
      imageObj['Source'] = 'Smugmug'      
      imageObj['Source Page Link'] = sImageObj['URL']
      imageObj['Title'] = sImageObj['Caption']
      imageObj['Width Px'] = sImageObj['Width']
      imageObj['Height Px'] = sImageObj['Height']
      imageObj['thumbnail'] = sImageObj['MediumURL']
      imageObj['icon'] = sImageObj['TinyURL']
      imageObj['url'] = sImageObj['X3LargeURL']  
      imageObj['LastUpdated'] = sImageObj['LastUpdated']
      
      urlAttrs = ['SmallURL','ThumbURL','TinyURL','LargeURL','XLargeURL','X2LargeURL','X3LargeURL']
      urlAttrs.each do |attr|
        if sImageObj[attr] != nil
          imageObj[attr] = sImageObj[attr]
        end
      end
      
      #render :json=>imageObj, :callback => params[:callback] 
      #look for redundant per user
      oldImageSet = @@userDb['privImages'].find({'smugmug_id'=>imageObj['smugmug_id'].to_i,'private_user'=>userObj['email']})
      if oldImageSet.count > 0
        oldImageObj = oldImageSet.to_a[0]
        if oldImageObj['LastUpdated'] < imageObj['LastUpdated']
          updateAttrs = urlAttrs+['format','Source Page Link', 'Title', 'Width Px', 'Height Px', 'thumbnail', 'url', 'LastUpdated']
          updateAttrs.each do |attr|
            oldImageObj[attr] = imageObj[attr]
          end
          @@userDb['privImages'].update({'id'=>oldImageObj['id']},oldImageObj)
          
        end
        
        if not listObj['images'].include? oldImageObj['id']
          @@userDb['privLists'].update({'id'=>listObj['id']},{'$push'=>{'images'=>oldImageObj['id']}})
          if listObj['images'].length == 0
            @@userDb['privLists'].update({'id'=>listObj['id']},{'$set'=>{'coverImage'=>oldImageObj['thumbnail']}})
          end
          
        end
        
        #else do nothing, ready to return

        result = {"Status"=>"success", "Message"=>"image is added to the viewlist", "smugmugId"=>oldImageObj['smugmug_id']}
        render :json=>result, :callback => params[:callback]  
        return         
        
      end
      
      # else, this image is a new one
     
      currIndex = getIndex('privImage')
      if currIndex == -1
         result =  {"Status"=>"failure","Message"=>"ID server not available!"}

         render :json=>result, :callback => params[:callback] 
      end
      
      imageObj['id'] = currIndex
      imageObj['viewlists'] = []
      imageObj['viewlists2'] = []
      imageObj['datetime_created'] = Time.now.utc.to_s
      imageObj['private_user'] = userObj['email']
      @@userDb['privImages'].insert(imageObj)
      @@userDb['privLists'].update({'id'=>listObj['id']},{'$push'=>{'images'=> imageObj['id']}})
      
      if listObj['images'].length == 0
         @@userDb['privLists'].update({'id'=>listObj['id']},{'$set'=>{'coverImage'=>imageObj['thumbnail']}})
      end      
      

      result = {"Status"=>"success", "Message"=>"image is added to the viewlist", "smugmugId"=>imageObj['smugmug_id']}
      render :json=>result, :callback => params[:callback]  
      return   
      
      
 end
 
 
def updatePlay
    if params[:email]==nil or params[:email].length==0
       result = {"Status"=>"failure", "Message"=>"error, no user email!"}
       render :json=>result, :callback => params[:callback]
       return
    end
   
   
         
   if params[:listId]==nil or params[:listId].length==0
       result = {"Status"=>"failure", "Message"=>"error, no viewlist ID!"}
       render :json=>result, :callback => params[:callback]
       return
   end
   
      userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','email']})
    
      if userSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no user found!"}

          render :json=>result, :callback => params[:callback]
          return
      end    
     
      userObj = userSet.to_a[0]

      viewlistSet = @@userDb['privLists'].find({"id"=>params[:listId].to_i})
      if viewlistSet.count == 0
          result = {"Status"=>"failure", "Message"=>"no viewlist found!"}

          render :json=>result, :callback => params[:callback]
          return
      end  
      
      listObj = viewlistSet.to_a[0]  
      
      @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'curr_list_images'=>listObj['images'],
        'curr_list'=>listObj['id'].to_i,'curr_cat'=>'My Viewlists', 'curr_image'=>listObj['images'][0].to_i}})
        
      result = {"Status"=>"success", "Message"=>"play function synced!"}

      render :json=>result, :callback => params[:callback]
   
   
 end 
 
 
    
end

  
