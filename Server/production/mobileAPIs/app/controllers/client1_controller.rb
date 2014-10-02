class Client1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'
  require 'curb'
  require 'securerandom'
  require 'net/http'
  
  
  
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

  @@gmailAccount = 'leonzfarm'  
  @@gmailPassword = 'aljzcsjusqohrujk' 
  
  @@api_key = '7c028a32e596566b2632e6f672df55af-us7' 
  
  
  
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
  
  
  def is_integer(str)
    return str.to_i.to_s == str
  end
    
  def getListSet(listId)
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
    
     if (not listId.is_a? Numeric) and (listId.include? 'top')
        return @@userDb['privLists'].find({'id'=>listId})
     end
     
     if (not listId.is_a? Numeric) and (listId.include? 'getty')
        return @@userDb['gettyLists'].find({'id'=>listId})
     end
     
     if listId.to_i >= @@privateRange
        return @@userDb['privLists'].find({'id'=>listId.to_i})
     end
     
     return @@contentDb['viewlists'].find({'id'=>listId.to_i})   
  end
  
  
  def getImageSet2(imageId,fields)
    
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
     
     if (not imageId.is_a? Numeric) and (imageId.include? 'getty')
        return @@userDb['gettyImages'].find({'id'=>imageId},{:fields=>fields})
     end     
     
     if imageId.to_i >= @@privateRange
        return @@userDb['privImages'].find({'id'=>imageId.to_i},{:fields=>fields})
     end
     
     return @@contentDb['images'].find({'id'=>imageId.to_i},{:fields=>fields})        
         
  end  
  
  
  def getImageSet(imageId)
    
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
     
     if (not imageId.is_a? Numeric) and (imageId.include? 'getty')
        return @@userDb['gettyImages'].find({'id'=>imageId})
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
  
  
  
  def login
    if(params[:email]==nil or params[:email].strip=='')
        result = {"Status"=>"failure", "Message"=>"email is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:password]==nil or params[:password].strip=='')
        result = {"Status"=>"failure", "Message"=>"password is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:email]=="guest@guest.guest")
      result = {"Status"=>"success", "Message"=>"user found!", "userObj"=>{'name'=>'guest'}, "token"=>'guest'}
      render :json=>result, :callback => params[:callback]
      return
    end    


    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','salt','pass_digest','tokens','id','isAdmin']})
    
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no user mathes!"}

        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"Status"=>"failure", "Message"=>"password is not set correctly, please reset your password via email!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    passDigest = Digest::SHA1.hexdigest(params[:password]+user["salt"])
    if passDigest != user["pass_digest"]
        result = {"Status"=>"failure", "Message"=>"wrong password!"}

        render :json=>result, :callback => params[:callback]
        return  
    end    
    
    sessionToken = SecureRandom.hex
    if user['tokens'] == nil
      @@userDb['users'].update({'email'=>params[:email].strip.downcase},{'$set'=>{'tokens'=>[sessionToken]}})
    else
      if user['tokens'].length == 5
        user['tokens'].shift 
      end
      
      user['tokens'].push(sessionToken)
      @@userDb['users'].update({'email'=>params[:email].strip.downcase},{'$set'=>{'tokens'=>user['tokens']}})
    end
    
    if user['isAdmin'] == nil
      user['isAdmin'] = false
    end
        
    result = {"Status"=>"success", "Message"=>"user found!", "userObj"=>{'name'=>user['name'], 'id'=>user['id'], 'isAdmin'=>user['isAdmin']}, "token"=>sessionToken}

    render :json=>result, :callback => params[:callback]
  end
  
  
  def resetPassword
    if(params[:email]==nil or params[:email].strip=='')
        result = {"Status"=>"failure", "Message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:oldpassword]==nil or params[:oldpassword].strip=='')
        result = {"Status"=>"failure", "Message"=>"old password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:newpassword]==nil or params[:newpassword].strip=='')
        result = {"Status"=>"failure", "Message"=>"new password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end

   
    if(params[:oldpassword]==params[:newpassword])
        result = {"Status"=>"failure", "Message"=>"new password must be different from old passowrd!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    

    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase})
    
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no user mathes!"}

        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"Status"=>"failure", "Message"=>"Password has never been set for this account, please get your temporal password via email!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    oldpassDigest = Digest::SHA1.hexdigest(params[:oldpassword]+user["salt"])
    if oldpassDigest != user["pass_digest"]
        result = {"Status"=>"failure", "Message"=>"wrong old password!"}

        render :json=>result, :callback => params[:callback]
        return  
    end    
    
    
    newsalt = rand(10000).to_s
    newpassDigest = Digest::SHA1.hexdigest(params[:newpassword]+newsalt)
    
    @@userDb["users"].update({"email"=>(params[:email].strip).downcase},{"$set"=>{"salt"=>newsalt, "pass_digest"=>newpassDigest}})
    result = {"Status"=>"success", "Message"=>"Password is reset!"}

    render :json=>result, :callback => params[:callback]
  end
  
  
  def emailPassword
    if(params[:email]==nil or params[:email].strip=='')
        result = {"Status"=>"failure", "Message"=>"email is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
              

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    user = userSet.to_a[0]
    
    length = 6
    randomPassword = rand(36**length).to_s(36)
    
    newsalt = rand(10000).to_s
    newpassDigest = Digest::SHA1.hexdigest(randomPassword+newsalt)
    
    @@userDb["users"].update({"email"=>(params[:email].strip).downcase},{"$set"=>{"salt"=>newsalt, "pass_digest" => newpassDigest}})
    
    result = {"Status"=>"success", "Message"=>"Your temporary password has been sent to your email, please reset it!"}

    render :json=>result, :callback => params[:callback]
    
    
    
    
    msgStr="From: ArtKick <support@artkick.com>\nTo: "+user["name"]+" <"+ (params[:email].strip).downcase+">\nSubject: Reset Your Password\n\nHi "+user["name"]+",\n\nThis is your temporary password:\n"+randomPassword+"\nplease reset it as soon as possible!\n\nBest regards,\nArtKick"
    
    smtp = Net::SMTP.new 'smtp.gmail.com', 587
    smtp.enable_starttls
    smtp.start("gmail.com", @@gmailAccount, @@gmailPassword, :login) do
      smtp.send_message(msgStr,"support@artkick.com",(params[:email].strip).downcase)
    end

    
  end
    
  
  def regUser
    if(params[:email]==nil or params[:email].strip=='')
        result = {"Status"=>"failure", "Message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:name]==nil or params[:name].strip=='')
        result = {"Status"=>"failure", "Message"=>"name missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:password]==nil or params[:password]=='')
        result = {"Status"=>"failure", "Message"=>"password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
          

    
    if @@userDb['users'].find({"email"=>(params[:email].strip).downcase}).count > 0
        result = {"Status"=>"failure", "Message"=>"This email is taken, please use a different email!"}

        render :json=>result, :callback => params[:callback]
        return
    end
    
    salt = rand(10000).to_s
    passDigest = Digest::SHA1.hexdigest(params[:password]+salt)
    
    sessionToken = SecureRandom.hex
    
                       
    userObj = {"name"=>params[:name].strip,"email"=>(params[:email].strip).downcase, "tokens"=>[sessionToken]}
    currIndex = getIndex('user')
    if currIndex == -1
      result =  {"Status"=>"failure","Message"=>"ID server not available!"}

      render :json=>result, :callback => params[:callback] 
    end
    
        
    userObj["id"] = currIndex
    
    userObj["salt"]=salt
    userObj["pass_digest"]=passDigest
    
    emptyArrays = ["images","viewlists","friends","adds","requests","owned_clients",
                    "playable_clients","plays"]
    
    for emptyArray in emptyArrays
        userObj[emptyArray]=[]
    end 
    
       
    @@userDb['users'].insert(userObj)

    
    
    
    result = {"Status"=>"success", "Message"=>"user created!", "token"=>sessionToken, "id"=>userObj["id"]}

    render :json=>result, :callback => params[:callback]  
    
    Gibbon::API.timeout = 15
    gb = Gibbon::API.new(@@api_key)
    names = userObj['name'].split
    fname = names[0]
    
    if names.length > 1
      lname = names[1]
    else
      lname = 'unknown'
    end
      
    begin
      gb.lists.subscribe({:id=>'1a8ac5d1a0', :email=>{:email=>userObj['email']}, :merge_vars=>{:FNAME=>fname, :LNAME=> lname},:double_optin => false})  
    rescue
      
    end

     userName = userObj['name']
     userEmail = userObj['email']
  
     url = "https://mandrillapp.com/api/1.0/messages/send-template.json"
     messageObj = {}
     messageObj['subject'] = 'Welcome to Artkick'
     messageObj['from_email'] = 'support@artkick.com'
     messageObj['from_name'] = 'Artkick'
     messageObj['to'] = [{'email'=>userEmail, 'name'=>userName, 'type'=>'to'}]
     messageObj['merge'] = false


     sendObj = {}
     sendObj['key'] = '7JbDmRBTdBkZoFF4r-9jfA'
     sendObj['template_name'] = 'Artkick Registration Confirmation'
     sendObj['template_content'] = [{'name'=>'example name', 'content'=>'example content'}]
     sendObj['message'] = messageObj
     sendObj['async'] = false
     sendObj['ip_pool'] = 'Main Pool'

     json_string = sendObj.to_json()
     c = Curl::Easy.http_post(url, json_string) do |curl|
        curl.headers['Content-Type'] = 'application/json'
        curl.headers['Accept'] = 'application/json'
     end

          
  end
  
  

  
  
  


  
  def update2    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        render :json=>result, :callback => params[:callback]
        return
    end 
       
    stretch = false
    if params[:stretch]!=nil
      stretch = params[:stretch]
    end
    
    user = userSet.to_a[0]
    list = nil
    listSet = getListSet(params[:list])
    if listSet.count > 0
       list = listSet.to_a[0]
    end
    
    
    if list == nil
      result = {'Status'=>'failure', 'Message'=>'The viewlist does not exist!'}
      render :json=>result, :callback => params[:callback]  
      return
    end
    
    if user["curr_list_images"] != nil and user["curr_list"].to_s==params[:list].to_s
      list["images"] = user["curr_list_images"]
    end

     
    subs = []

          
    iosSubs = false
    if user['iosExpireMs'] != nil and user['iosExpireMs'].to_i - utcMillis() > 0
      iosSubs = true
    end
    
    androidSubs = false
    if user['androidSubs'] == true
      androidSubs = true
    end
    
    testSubs = false
    if user['testSubs'] == true
      testSubs = true
    end
    
    subs = iosSubs or androidSubs    
       
    if testSubs == true
      subs = true
    end   
    
    
    

    
    
       
    currIndex = 0
    while currIndex < list["images"].length
       if list["images"][currIndex].to_s == params[:imageID].to_s
          break
       end
       currIndex += 1
    end
          
    if currIndex >= list["images"].length
      result = {'Status'=>'failure', 'Message'=>'The image does not exist!'}
      render :json=>result, :callback => params[:callback]  
      return       
    end      
            

    
   if params[:players] == nil
      params[:players] = []
   end
    
    imageObj = nil
    imageSet = getImageSet(params[:imageID])
    if imageSet.count > 0
      imageObj = imageSet.to_a[0]
    end
 
    
    if imageObj == nil
      result = {'Status'=>'failure', 'Message'=>'The image does not exist!'}
      render :json=>result, :callback => params[:callback]  
      return      
    end
    
    
   
    message = {}
    message['type'] = "image"
    message['imageURL'] = imageObj['url']
    message['title'] = URI.escape(imageObj['Title'])
    message['stretch'] = stretch
    message['nextPull'] = 0
    if imageObj["Artist Last N"]==nil
       message["caption"]=""
    else
       message["caption"]=URI.escape(imageObj["Artist First N"])+' '+URI.escape(imageObj["Artist Last N"])
    end
    
    if imageObj['id'].to_s.include?'getty'
      #"Getty_Entertainment", "Getty_Sports", "Getty_News", "Getty_All"
      userSubs = ''
      
      subs = []    
      if user['test_subs']!=nil and user['test_subs'].length > 0
         subs = [user['test_subs'][0]]
      end
      
      if user['ios_subs']!=nil
        user['ios_subs'].each do |prodName|
          if prodName!=nil and user['ios_subs_detail'][prodName] > utcMillis
            if prodName == 'Getty_All2'
              subs = ['Getty_All']
              break
            end
          
            if not subs.include? prodName
              subs.push(prodName)
            end             
          end

        end
      end
      
   android_subs = ['Getty_Sports','Getty_Entertainment','Getty_News','Getty_Upgrade', 'Getty_All2']
   android_subs.each do |prodName|
     if user['android_'+prodName.downcase+'_expire'] != nil and user['android_'+prodName.downcase+'_expire'] > utcMillis
       
       if prodName == 'Getty_All2'
         subs = ['Getty_All']
         break
       end
       
       if not subs.include? prodName
         subs.push(prodName)
       end
       
     end
   end      
      
      
      if subs.length > 1
        subs = ['Getty_All']
      end
      
      if subs.length > 0
        userSubs = subs[0]
      end
      
      permitted = false
      
      if 'getty_'+imageObj['gettyDomain'].downcase == userSubs.downcase or userSubs == 'Getty_All'
        permitted = true
      end
      
      if imageObj['has_highres'] == true and permitted
        message['imageURL'] = imageObj['artkick_url']
      end
      
      if (not permitted) and imageObj['waterMark']!=nil
        message['imageURL'] = imageObj['waterMark']
      end 
      
      message['caption'] = URI.escape(imageObj['Copyright'])
      
    end
    
   message['imageURL'] = message['imageURL'].sub('https://','http://')
   userPlayers = user['owned_clients']+user['playable_clients']
   validClients = []


   setImageId = params[:imageID]
   if !setImageId.include?'getty'
     setImageId = setImageId.to_i
   end

   params[:players].each do |account|
       
       if not userPlayers.include? account
         next
       end
      
       validClients.push(account)
       playerSet = @@userDb['clients'].find({"account"=>account})
       if playerSet.count > 0
         player = playerSet.to_a[0]
         currListImages = []
         if list["images"] != nil
           currListImages = list["images"]
         end

         @@userDb['clients'].update({"account"=>player["account"]},"$set"=>{"curr_image"=>setImageId,"image_time_stamp"=>utcMillis(), "stretch"=>stretch,
      "curr_list"=>params[:list], "curr_index"=>currIndex, "curr_list_images"=>currListImages, "curr_user"=>params[:email]})
      

          
          
          
       end
       
    end
    
    
    if message != nil
        base = 'http://shrouded-chamber-7349.herokuapp.com/pushMulti'
        uri = URI(base)
        message['receivers'] = validClients
             
        begin
           Net::HTTP.post_form(uri, message)
        rescue
               
        end
    end 
    
    
    currListId = params[:list]
    if not currListId.is_a? Fixnum
      currListId = currListId.to_s
    else
      currListId = currListId.to_i
    end
    
    
    @@userDb['users'].update({"email"=>params[:email]},"$set"=>{"curr_image"=>setImageId,"curr_list"=>currListId,"curr_cat"=>params[:cat], "fill"=>stretch,
      "curr_list_images"=>list["images"], "last_visit"=>utcMillis()})
      
      
 
      
  
      
    result = {"result"=>"success", "Message"=>"updated!", "players"=>validClients}   
    render :json=>result, :callback => params[:callback]    
  end  



 def deleteComment
    if(params[:imageId]==nil or params[:imageId].length==0)
      result = result = {"Status"=>"failure", "Message"=>"no image id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:email]==nil or params[:email].length==0)
      result = {"Status"=>"failure", "Message"=>"no user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end   
    
    
    if params[:comment_id]==nil 
        result = {"Status"=>"failure", "Message"=>"comment_id is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end   
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]    
    commentSet = @@userDb['imageComments'].find({"id"=>params[:imageId].to_i})
    
    if commentSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no comment found!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    commentObj = commentSet.to_a[0]
    
    index = 0
    commentObj["comments"].each do |cmt|
      
      if cmt['comment_id'] == params[:comment_id].to_i
        if cmt["user_id"].to_i != userObj["id"].to_i and !userObj["isAdmin"]
           result = {"Status"=>"failure", "Message"=>"the comment doesn't belong to the user!"}
           render :json=>result, :callback => params[:callback]
           return        
        end
        
        break
                
      end
      index += 1
    end
    
    

      
    commentObj["commentNum"] -= 1
    commentObj["comments"].delete_at(index)
    @@userDb["imageComments"].update({"id"=>commentObj["id"].to_i},{"$set"=>{"commentNum"=>commentObj["commentNum"], "comments"=>commentObj["comments"]}})

    
    result = {"Status"=>"success", "Message"=>"comment deleted!"}
    render :json=>result, :callback => params[:callback]    
    
 end  
  
 def getCommentId
   idObj = @@userDb['ids'].find().to_a[0]
   currIndex = idObj['comment']
   @@userDb['ids'].update({},{'$set'=>{'comment'=>currIndex+1}})
   return currIndex
 end 

 def commentImage
    if(params[:imageId]==nil or params[:imageId].length==0)
      result = result = {"Status"=>"failure", "Message"=>"no image id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:email]==nil or params[:email].length==0)
      result = {"Status"=>"failure", "Message"=>"no user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end   
    
    
    if params[:text]==nil 
        result = {"Status"=>"failure", "Message"=>"text is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end   
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    if params[:imageId].to_i.to_s == params[:imageId].to_s
      params[:imageId] = params[:imageId].to_i
    end
        
    
    
    
    cmt = {"user_id"=>userObj["id"].to_i, "user_name"=>userObj["name"], "text"=>params[:text], "time_stamp"=>utcMillis()}
    cmt['comment_id'] = getCommentId()
    
    commentSet = @@userDb['imageComments'].find({"id"=>params[:imageId]})
    if commentSet.count == 0
      commentObj = {"id"=>params[:imageId], "commentNum"=>1, "comments"=>[cmt]}
      @@userDb["imageComments"].insert(commentObj)
    else
      commentObj = commentSet.to_a[0]
      commentObj["commentNum"] += 1
      commentObj["comments"].push(cmt)
      @@userDb["imageComments"].update({"id"=>commentObj["id"].to_i},{"$set"=>{"commentNum"=>commentObj["commentNum"], "comments"=>commentObj["comments"]}})
    end
    
    result = {"Status"=>"success", "Message"=>"comment uploaded!", "comment_id"=>cmt['comment_id']}
    render :json=>result, :callback => params[:callback]    
    
 end  





  
  
  def likeImage
    if(params[:imageId]==nil or params[:imageId].length==0)
      result = result = {"Status"=>"failure", "Message"=>"no image id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:email]==nil or params[:email].length==0)
      result = {"Status"=>"failure", "Message"=>"no user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end   
    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    #convert imageId to either integer or string
    if params[:imageId].to_i.to_s == params[:imageId].to_s
      params[:imageId] = params[:imageId].to_i
    end
    
    
    
    like = true
    if params[:like]=="0"
      like = false
    end
    
    if userObj["likeImages"] == nil
      userObj["likeImages"] = []
    end
    
    if like and not userObj["likeImages"].include? params[:imageId]
      userObj["likeImages"].push(params[:imageId])
    end
    
    if not like
      userObj["likeImages"].delete(params[:imageId])
    end
    
    @@userDb["users"].update({"email"=>userObj["email"]},{"$set"=>{"likeImages"=>userObj["likeImages"]}})
    imageSet = getImageSet(params[:imageId])
    if imageSet.count > 0
      imageObj = imageSet.to_a[0]
      if imageObj['id'].to_s.include? 'getty'
       if like
          if imageObj['refNum'] == nil
            imageObj['refNum'] = 1
          else
            imageObj['refNum'] += 1
          end
        else
          if imageObj['refNum'] == nil
            imageObj['refNum'] = 0
          else
            imageObj['refNum'] -= 1
          end
        end
        
        if imageObj['refNum'] < 0
          imageObj['refNum'] = 0
        end
        
        @@userDb['gettyImages'].update({'id'=>imageObj['id']},{'$set'=>{'refNum'=>imageObj['refNum']}})
              
      end 
    end
    
    imageLikeSet = @@userDb['imageLikes'].find({"id"=>params[:imageId]})
    if imageLikeSet.count == 0
       if like      
          imageLikeObj = {"id"=> params[:imageId], "likeMap"=>{userObj["id"].to_s=>true}, "likeNum"=>1}
          if imageObj != nil and imageObj['categories']!= nil
            imageLikeObj['categories'] = imageObj['categories']
          end
          @@userDb["imageLikes"].insert(imageLikeObj)
       end
    else
      imageLikeObj = imageLikeSet.to_a[0]
      if imageObj != nil and imageObj['categories']!= nil
         @@userDb["imageLikes"].update({"id"=>imageObj["id"]},{"$set"=>{"categories"=>imageObj["categories"]}})
      end
      
      if imageLikeObj["likeMap"][userObj["id"].to_s] != nil #this means the user liked it!
        if like
          # do nothing
        else
          imageLikeObj["likeMap"].delete(userObj["id"].to_s)
          imageLikeObj["likeNum"] -=1 
          if imageLikeObj["likeNum"]<0
            imageLikeObj["likeNum"] = 0
          end
          @@userDb["imageLikes"].update({"id"=>imageLikeObj["id"]},{"$set"=>{"likeMap"=>imageLikeObj["likeMap"], "likeNum"=>imageLikeObj["likeNum"]}})
        end
      else       
        if like
          imageLikeObj["likeMap"][userObj["id"].to_s] = true
          imageLikeObj["likeNum"] += 1
          @@userDb["imageLikes"].update({"id"=>imageLikeObj["id"]},{"$set"=>{"likeMap"=>imageLikeObj["likeMap"], "likeNum"=>imageLikeObj["likeNum"]}})        
        else
          # do nothing
        end  
      end    
    end
    result = {"Status"=>"success", "Message"=>"like updated!"}
    render :json=>result, :callback => params[:callback]
            
  end
  
   
  def rateImage
    if(params[:imageId]==nil or params[:imageId].length==0)
      result = {"result"=>"error, no image id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:email]==nil or params[:email].length==0)
      result = {"result"=>"error, no email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:rating]==nil or params[:rating].length==0)
      result = {"result"=>"error, no rating!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    if params[:imageId].to_i.to_s == params[:imageId].to_s
      params[:imageId] = params[:imageId].to_i
    end
    
    
    
    if @@userDb["imageRatings"].find({"img_id"=>params[:imageId], "user_email"=>params[:email].strip.downcase}).count > 0
      if params[:rating].to_i > 0
        @@userDb["imageRatings"].update({"img_id"=>params[:imageId], "user_email"=>params[:email].strip.downcase},{"$set"=>{"rating"=>params[:rating].to_i}})
      else
        @@userDb["imageRatings"].remove({"img_id"=>params[:imageId], "user_email"=>params[:email].strip.downcase})
      end
      
    else
      @@userDb["imageRatings"].insert({"img_id"=>params[:imageId], "user_email"=>params[:email].strip.downcase, "rating"=>params[:rating].to_i})
    end
    result = {"result"=>"rating updated!"}

    render :json=>result, :callback => params[:callback]
    
    
  end
  
  def selectPlayers
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    if(params[:players]==nil)
      result = {"Status"=>"failure", "Message"=>"No player accounts!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    @@userDb["users"].update({"email"=>params[:email]},{"$set"=>{"selected_players"=>params[:players]}})
    result = {"Status"=>"success", "Message"=>"The players are selected!"}

    render :json=>result, :callback => params[:callback]
    
  end
  
  def getSelectedPlayers
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    selectedPlayers = userSet.to_a[0]["selected_players"]
    result = {"Status"=>"success", "selectedPlayers"=>selectedPlayers}

    render :json=>result, :callback => params[:callback] 
  end
  
  
   def setresolution
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    
    if params[:highres] == 'true'
      hires = 1
    else
      hires = 0
    end
    
    
    @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'hires'=>hires}})
    result = {"Status"=>"success", "Message"=>"hires status is set!"}
    render :json=>result, :callback => params[:callback]
    
   end
  
  
  
   def getUserStatus
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    

    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    @@userDb['login_records'].insert({'email'=>(params[:email].strip).downcase,'time_stamp'=>utcMillis, 'ip_address'=>request.remote_ip})
    
    user = userSet.to_a[0]
    
    defaultObj = @@contentDb['defaults'].find().to_a[0]
    
    fixDefault = false
    if(user["curr_image"]==nil or user["curr_image"]=='') or (getImageSet(user["curr_image"]).count==0 and !user["curr_image"].to_s.include?'getty')
       fixDefault = true
    end
    
    if(user["curr_list"]==nil or user["curr_list"]=='') or (getListSet(user["curr_list"]).count == 0 and !user["curr_list"].to_s.include?'getty')
       fixDefault = true
    end
        
    if fixDefault
      user['curr_cat'] = defaultObj['category']
      user['curr_image'] = defaultObj['image']
      user['curr_list'] = defaultObj['viewlist']
    end    
        
    
    shuffle = "false"
    if user["shuffle"] == 1
      shuffle = "true"
    end
    
    
    hires = "false"
    if user["hires"] == 1
      hires = "true"
    end
    
    
    result = {"Status"=>"success", "curr_image"=>user["curr_image"], "curr_list"=>user["curr_list"],"curr_cat"=>user["curr_cat"],
      "fill"=>user["fill"], "autoInterval"=>user["autoInterval"], "shuffle"=>shuffle, "hires"=>hires}
      
   
    if user['gettyLists']== nil
      user['gettyLists'] = {}
    end
    
    if user['gettyHistory'] == nil
      result['gettyHistory'] = []
    else
      result['gettyHistory'] = user['gettyHistory']
    end
    
    #get user getty lists

    result['gettyLists'] = []
    user['gettyLists'].each do |key, val|
      result['gettyLists'].push(val)
    end
    
    result['gettyLists'].reverse!
    
    # get search lists
    if user['search_lists'] == nil
      user['search_lists'] = []
    end 
    
    searchLists = @@userDb['privLists'].find({'id'=>{'$in'=>user['search_lists']}},{:fields=>['name','id','imageNum','coverImage','domain']}).sort({'id'=>-1}).to_a
    
    result['searchLists'] = []
    searchLists.each do |searchList|
      searchList['id'] = searchList['id'].to_i
      searchList.delete("_id")
      result['searchLists'].push(searchList)
    end
    
      
    
    subs = []    
    if user['test_subs'] != nil
      user['test_subs'].each do |prodName|
        if not subs.include? prodName
          subs.push(prodName)
        end
      end
    end
    
    if user['ios_subs']!=nil
      user['ios_subs'].each do |prodName|
        if prodName!=nil and user['ios_subs_detail'][prodName] > utcMillis
          if prodName == 'Getty_All2'
            subs = ['Getty_All']
            break
          end
          
          if not subs.include? prodName
            subs.push(prodName)
          end
          
        end
      end
    end
    
   android_subs = ['Getty_Sports','Getty_Entertainment','Getty_News','Getty_Upgrade', 'Getty_All2']
   android_subs.each do |prodName|
     if user['android_'+prodName.downcase+'_expire'] != nil and user['android_'+prodName.downcase+'_expire'] > utcMillis
       
       if prodName == 'Getty_All2'
         subs = ['Getty_All']
         break
       end
       
       if not subs.include? prodName
         subs.push(prodName)
       end
       
     end
   end    
    
    
    if subs.length > 1
      subs = ['Getty_All']
    end
    
    if subs.length == 1 and subs[0]=='Getty_Upgrade'
      subs = []
      
      #warn the user to cancel the upgrade 
      
        base = 'http://mighty-sea-2736.herokuapp.com/subsWarn'
        uri = URI(base)
        message = {}
        message['email'] = user['email']
        message['name'] = user['name']
             
        begin
           Net::HTTP.post_form(uri, message)
        rescue
          
        end
      
    end
    
    new_subs = []
    if user['new_subs'] != nil
      user['new_subs'].each do |subs|
        new_subs.push(subs)
      end
    end
    
    @@userDb['users'].update({'email'=>user['email']},{'$set'=>{'new_subs'=>[]}})
    
    result['subscriptions'] = subs
    result['newSubscriptions'] = new_subs
            
    render :json=>result, :callback => params[:callback]
    
  end
  
  
  def setLogo
    
  end
  
  
  def setOrientation
    if(params[:snumber]==nil or params[:orientation]==nil or params[:snumber].strip=='' or params[:orientation].strip=='')
        result = {"Status"=>"failure", "Message"=>"parameter(s) missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    validOts = ['vertical1', 'vertical2', 'horizontal']
    if not validOts.include? params[:orientation]
        result = {"Status"=>"failure", "Message"=>"invalid orientation value!"}
        render :json=>result, :callback => params[:callback]
        return 
    end
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    user = userSet.to_a[0]
    
    
    playerSet = @@userDb['clients'].find({"account"=>params[:snumber].strip})
    if playerSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no player found!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    player=playerSet.to_a[0]
    
    #@@userDb['clients'].update({"account"=>{"$in"=>user['owned_clients']}},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i, "lastAutoAssign"=>-1,
    #  "auto_user"=>autoUser}}, :multi=>true)
      
    @@userDb['clients'].update({"account"=>{"$in"=>[player['account']]}},{"$set"=>{"orientation"=>params[:orientation]}}, :multi=>true)      

    result = {"Status"=>"success", "Message"=>"updated!"}   

    render :json=>result, :callback => params[:callback]
    
    
    message = {}
    message['type'] = "orientation"
    message['orientation'] = params[:orientation]
    
    if message != nil
        base = 'http://shrouded-chamber-7349.herokuapp.com/pushMulti'
        uri = URI(base)
        #message['receivers'] = user['owned_clients']
        message['receivers'] = [player['account']] 
        
         
        begin
           Net::HTTP.post_form(uri, message)
        rescue
               
        end
    end 
 
  end    
  
  
  
  
  def setAuto
    if(params[:snumber]==nil or params[:autoInterval]==nil or params[:snumber].strip=='' or params[:autoInterval].strip=='')
        result = {"Status"=>"failure", "Message"=>"parameter(s) missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    user = userSet.to_a[0]
    
    
    playerSet = @@userDb['clients'].find({"account"=>params[:snumber].strip})
    if playerSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no player found!"}

        render :json=>result, :callback => params[:callback]
        return
    end
    
    player=playerSet.to_a[0]
    currIndex = player["curr_index"]
    if currIndex == nil
      currIndex = -1
    end
    
    autoUser = params[:email]
    if params[:autoInterval].strip.to_i == 0
      #user quit auto play, to make it clear, we set the auto user to be the player's owner
      userSet = @@userDb['users'].find({'id'=>player['owner'].to_i})
      if userSet.count > 0
        userObj = userSet.to_a[0]
        autoUser = userObj['email']
      end
    end
   
    #@@userDb['clients'].update({"account"=>{"$in"=>user['owned_clients']}},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i, "lastAutoAssign"=>-1,
    #  "auto_user"=>autoUser}}, :multi=>true)
      
    @@userDb['clients'].update({"account"=>{"$in"=>[player['account']]}},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i, "lastAutoAssign"=>-1,
      "auto_user"=>autoUser}}, :multi=>true)
      
    @@userDb['users'].update({"email"=>params[:email]},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i}})

    result = {"Status"=>"success", "Message"=>"updated!"}   

    render :json=>result, :callback => params[:callback]
    
    
    message = {}
    message['type'] = "autoPlay"
    message['autoInterval'] = params[:autoInterval].strip.to_i
    
    if message != nil
        base = 'http://shrouded-chamber-7349.herokuapp.com/pushMulti'
        uri = URI(base)
        #message['receivers'] = user['owned_clients']
        message['receivers'] = [player['account']] 
        
         
        begin
           Net::HTTP.post_form(uri, message)
        rescue
               
        end
    end 
 
  end
  
  def getDefault

    defaultObjSet = @@contentDb['defaults'].find()
    if defaultObjSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no defaults found!"}

        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    result = {"Status"=>"success", "defaults"=>defaultObjSet.to_a[0]}   
 
    render :json=>result, :callback => params[:callback]
    
  end
 
 
def getViewlist4

    if(params[:id]==nil)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:id].length==0)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    

    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    user = userSet.to_a[0]
    if user["curr_list_images"]==nil
      listSet = getListSet(user["curr_list"])
      if listSet.count > 0
        list = listSet.to_a[0]
        user["curr_list_images"]=list["images"]
        @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>list["images"]}})
        
      end
      
    end
    
    
    
    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      dynImages = @@userDb["imageRatings"].find({"user_email"=>params[:email].strip.downcase}).to_a
      
      #get startIndex
      if params[:tarImage].to_s == '-1'
        
        startIndex = 0
        dynImages.each do|image|
          viewlist["images"].append(image["img_id"].to_i)
        end
        
      else
        startIndex = 0
        index = 0
        dynImages.each do|image|
          if image["img_id"].to_s == params[:tarImage].to_s
            startIndex = index
          end
          viewlist["images"].append(image["img_id"].to_i)
          index = index+1
        end
        
        
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = dynImages[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = dynImages[startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end          
          
        else
          images = dynImages[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        
        
      #backward  
      else
        
        fromIndex = 0
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = dynImages[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = dynImages[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil
        images = []
      end
      
      images.each do|image|      
        imageSet = getImageSet(image["img_id"])
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
           imageObj["User Rating"]=image["rating"]

           if image["rating"].to_i > 0
              viewlist["imageSet"].append(imageObj)
              
           else
             @@userDb["imageRatings"].remove({"user_email"=>params[:email].strip.downcase, "img_id"=>image["img_id"].to_i})
           end
           
        else
          @@userDb["imageRatings"].remove({"user_email"=>params[:email].strip.downcase, "img_id"=>image["img_id"].to_i})
          
        end 
        
      
      end
      # this only applied for star rated images!
      @@userDb["privLists"].remove({"id"=>params[:id]})
      @@userDb["privLists"].insert(viewlist)
      viewlist["dynImages"]=images
      @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})   
      

      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    viewlistSet = getListSet(params[:id])
    
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}

      render :json=>result, :callback => params[:callback]
    end
    
    
    
    
    
    viewlist = viewlistSet.to_a[0] 
    
    if viewlist["id"].to_s == user["curr_list"].to_s and user["shuffle"] == params[:shuffle].to_i
      viewlist["images"] = user["curr_list_images"]
    else
      if params[:shuffle].to_i==1
         viewlist["images"] = viewlist["images"].shuffle
      end
      
      @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})      
      
      
    end
  
    
    viewlist["imageSet"]=[]
    
    if params[:array] != nil
      viewlist["images"] = params[:array]
    end
    
    
    images = viewlist["images"]

      #get startIndex
      if params[:tarImage].to_s == '-1' 
        startIndex = 0
      else
        startIndex = 0
        images.each do|image|
          if image.to_s == params[:tarImage].to_s
            break
          end
          startIndex = startIndex+1
        end
      end
      
      if startIndex >= images.length
        startIndex = images.length-1
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = images[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          # if the target image is the last image, then append the second last to it and force the chunk to be backward
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = viewlist["images"][startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end
          
        else
          images = images[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        

        
      #backward  
      else
        
        fromIndex = 0
        
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = images[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = images[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil
        images = []
      end
    
    images.each do|image|
      
      imageSet = getImageSet(image)
      if imageSet.count > 0
        
        
        imageObj = imageSet.to_a[0]
        if params[:email]!=nil
           ratingSet = @@userDb["imageRatings"].find({"img_id"=>image.to_i,"user_email"=>(params[:email].strip).downcase})
           if ratingSet.count> 0
             ratingObj = ratingSet.to_a[0]
             imageObj["User Rating"]=ratingObj["rating"]
           end
        end
        
        viewlist["imageSet"].append(imageObj)
      end
    end
    
 
    render :json=>viewlist, :callback => params[:callback]
 
    
 
 
 end 
 



 
 
  def feedback
    if params[:email] == nil or params[:email].strip.length == 0
      result = {"status"=>"failure", "Message"=>"user email is missing!"}
      render :json=>result, :callback => params[:callback]
      return
    end

    if params[:text] == nil or params[:text].strip.length == 0
      result = {"status"=>"failure", "Message"=>"text is missing!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
     if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    subject = 'inquiry from application'
    if params[:subject]!=nil
      subject = params[:subject]
    end
    
    username = "sheldon@artkick.com" 
    password = "Sunnie" 
    url = 'https://artkick.zendesk.com/api/v2/tickets.json'
    ticket = {"ticket"=>{"requester"=>{"name"=>userObj['name'],"email"=>params[:email].strip.downcase}, "subject"=>subject, "comment"=>{ "body"=>params[:text]}}}
    json_string = ticket.to_json()
    c = Curl::Easy.http_post(url, json_string) do |curl|
      curl.headers['Content-Type'] = 'application/json'
      curl.headers['Accept'] = 'application/json'
      curl.username = username
      curl.password = password
    end
    
    result = {'result'=>'Your ticket is submitted!'}

    render :json=>result, :callback => params[:callback]
  end

  def verifyUser
    if(params[:email]==nil or params[:email].strip=='')
        result = {"status"=>"failure", "message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
     if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip},{:fields=>['name','id','isAdmin']})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    if userObj['isAdmin'] == nil
      userObj['isAdmin'] = false
    end
    result = {"Status"=>"success", "Message"=>"user found!", "userObj"=>userObj}

    render :json=>result, :callback => params[:callback]
  end
  
  
  
  def removeUser
    if(params[:email]==nil or params[:email].strip=='')
        result = {"Status"=>"failure", "Message"=>"email is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:password]==nil or params[:password].strip=='')
        result = {"Status"=>"failure", "Message"=>"password is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    


    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','salt','pass_digest','tokens','private_lists','owned_clients','email']})
    
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no user mathes!"}

        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"Status"=>"failure", "Message"=>"wrong password!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    passDigest = Digest::SHA1.hexdigest(params[:password]+user["salt"])
    if passDigest != user["pass_digest"]
        result = {"Status"=>"failure", "Message"=>"wrong password!"}

        render :json=>result, :callback => params[:callback]
        return  
    end        
  
    # remove private lists
    if user['private_lists'] != nil
       user['private_lists'].each do |listId|
           @@contentDb['privLists'].remove({'id'=>listId.to_i})
       end 
    
    end
    @@userDb['privLists'].remove({'private_user'=>user['email']})
    
    
    # remove devices
    user['owned_clients'].each do |account|
      playerSet = @@userDb['clients'].find({'account'=>account},{:fields=>["account","playable_users"]})
      if playerSet.count > 0
        player = playerSet.to_a[0]
        player["playable_users"].each do |userId|
          @@userDb['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>player["account"]}})
          @@userDb['users'].update({"id"=>userId.to_i},{"$pull"=>{"playable_clients"=>player["account"]}})
        end
        @@userDb['clients'].remove({'account'=>account})
      end
    end

    @@userDb['users'].remove({'email'=>user['email']}) 
    
    
    
    
    result = result = {"Status"=>"success", "Message"=>"user has been removed!"}

    render :json=>result, :callback => params[:callback]
    
    
    end
    
   def getViewlist5

    if(params[:id]==nil)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:id].length==0)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    

    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    #userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase})
    if params[:email]!='guest@guest.guest' and userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
     
    
    @@userDb['viewlist_records'].insert({'email'=>(params[:email].strip).downcase, 'viewlist'=>params[:id], 'time_stamp'=>utcMillis,'ip_address'=>request.remote_ip})
    
    if params[:email] == 'guest@guest.guest'
       user = {'curr_list'=>-1, 'shuffle'=>0, 'email'=>'guest@guest.guest'}
    else
    
       user = userSet.to_a[0]

    end
    
    
    if user["curr_list_images"]==nil
       user["curr_list_images"]=[]
    end      

    if(params[:id][0..7]=='topLiked')
      viewlist = {"id"=>params[:id], "name"=>"Most liked"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
                
      
      #get startIndex
      if params[:tarImage].to_s == '-1' or user['email'] == 'guest@guest.guest'
        if params[:catName]!=nil
          likeSet = @@userDb["imageLikes"].find({"likeNum"=>{"$gt"=>0}, "categories"=>params[:catName]}).sort({"likeNum"=>-1}).limit(100)
        else
          likeSet = @@userDb["imageLikes"].find({"likeNum"=>{"$gt"=>0}}).sort({"likeNum"=>-1}).limit(100)
        end
        
        dynImages = []
        likeSet.to_a.each do |likeObj|
          dynImages.push(likeObj["id"])
        end
        
        if params[:shuffle].to_i==1
           dynImages = dynImages.shuffle
        end
        
        
        startIndex = 0
      
        
        dynImages.each do|image|
          viewlist["images"].append(image)
        end
        
      else
        if user['curr_list_images']!= nil
           dynImages = user['curr_list_images']
        end
        startIndex = 0
        index = 0
        dynImages.each do|image|
          if image.to_s == params[:tarImage].to_s
            startIndex = index
          end
          viewlist["images"].append(image)
          index = index+1
        end
        
        
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = dynImages[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = dynImages[startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end          
          
        else
          images = dynImages[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        
        
      #backward  
      else
        
        fromIndex = 0
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = dynImages[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = dynImages[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil
        images = []
      end
      
      images.each do|image|      
        imageSet = getImageSet(image)
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
           likeSet = @@userDb["imageLikes"].find({"id"=>image})
           if likeSet.count > 0
             likeObj = likeSet.to_a[0]
           else
             likeObj = {"id"=>imageObj["id"], "likeNum"=>0, "likeMap"=>{}}
           end
           
           imageObj["likeNum"] = likeObj["likeNum"]
           if likeObj["likeMap"][user["id"].to_s]
             imageObj["like"] = true
           else
             imageObj["like"] = false
           end
           viewlist["imageSet"].append(imageObj)
           
           
           commentSet = @@userDb["imageComments"].find({"id"=>image})
           if commentSet.count > 0
             commentObj = commentSet.to_a[0]
           else
             commentObj = {"id"=>imageObj["id"], "commentNum"=>0,"comments"=>[]}
           end
           imageObj["commentNum"] = commentObj["commentNum"]
           imageObj["comments"] = commentObj["comments"][0...10]     
           imageObj.delete("artkick_url") #protect high-res url
        else
           viewlist["imageNum"] = 0
           viewlist.delete("images")
           render :json=>viewlist, :callback => params[:callback]
           return        
        end 
      
      end
      
      @@userDb["privLists"].remove({"id"=>params[:id]})
      @@userDb["privLists"].insert(viewlist)
      
      @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist['images'], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})   
      

      viewlist["imageNum"] = viewlist["images"].length
      if viewlist["imageNum"] > 0
          viewlist["startImage"] = viewlist["images"][0]
          viewlist["endImage"] = viewlist["images"][viewlist["imageNum"]-1]
      end

      viewlist.delete("images")

      render :json=>viewlist, :callback => params[:callback]
      return
    end
    
    
    
    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      if user['likeImages'] == nil
        user['likeImages'] = []
      end
          
      
      #get startIndex
      if params[:tarImage].to_s == '-1' 
        dynImages = user['likeImages']
        if params[:shuffle].to_i==1
           dynImages = dynImages.shuffle
        end
        
        
        startIndex = 0
      
        
        dynImages.each do|image|
          if image.to_i.to_s == image.to_s
            image = image.to_i
          end          
          viewlist["images"].append(image)
        end
        
      else
        if user['curr_list_images']!= nil
           dynImages = user['curr_list_images']
        end
        startIndex = 0
        index = 0
        dynImages.each do|image|
          if image.to_s == params[:tarImage].to_s
            startIndex = index
          end
          
          if image.to_i.to_s == image.to_s
            image = image.to_i
          end   
          
          viewlist["images"].append(image)
          index = index+1
        end
        
        
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = dynImages[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = dynImages[startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end          
          
        else
          images = dynImages[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        
        
      #backward  
      else
        
        fromIndex = 0
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = dynImages[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = dynImages[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil
        images = []
      end
      
      images.each do|image|      
        imageSet = getImageSet(image)
        if image.to_i.to_s == image.to_s
           image = image.to_i
        end   
        
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
           likeSet = @@userDb["imageLikes"].find({"id"=>image})
           if likeSet.count > 0
             likeObj = likeSet.to_a[0]
           else
             likeObj = {"id"=>imageObj["id"], "likeNum"=>1, "likeMap"=>{user["id"].to_s=>true}}
           end
           
           imageObj["likeNum"] = likeObj["likeNum"]
           imageObj["like"] = true
           viewlist["imageSet"].append(imageObj)
           
           
           commentSet = @@userDb["imageComments"].find({"id"=>image})
           if commentSet.count > 0
             commentObj = commentSet.to_a[0]
           else
             commentObj = {"id"=>imageObj["id"], "commentNum"=>0,"comments"=>[]}
           end
           imageObj["commentNum"] = commentObj["commentNum"]
           imageObj["comments"] = commentObj["comments"][0...10]     
        else
           viewlist["imageNum"] = 0
           viewlist.delete("images")
           render :json=>viewlist, :callback => params[:callback]
           return               
             
        end 
      
      end
      
      
      @@userDb["privLists"].remove({"id"=>params[:id]})
      @@userDb["privLists"].insert(viewlist)
      @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist['images'], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})   
      

      viewlist["imageNum"] = viewlist["images"].length
      if viewlist["imageNum"] > 0
          viewlist["startImage"] = viewlist["images"][0]
          viewlist["endImage"] = viewlist["images"][viewlist["imageNum"]-1]
      end
      viewlist.delete("images");

      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    viewlistSet = getListSet(params[:id])
    
    if viewlistSet.count == 0
      result = {"Status"=>"failure", "Message"=>"unkown viewlist!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    
    
    
    viewlist = viewlistSet.to_a[0] 
    
    if params[:tarImage].to_s == '-1'
      #start over
      if params[:shuffle].to_i==1
         viewlist["images"] = viewlist["images"].shuffle
      end  
      
      if viewlist["id"].is_a? Numeric
        @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"].to_i,
        "shuffle"=>params[:shuffle].to_i}})              
      else
        @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"],
        "shuffle"=>params[:shuffle].to_i}})      
      end
      
   
      
    else
      #continuation do not re-shuffle
      if user['email']!= 'guest@guest.guest' and user["curr_list_images"] != nil and user["curr_list"].to_s == viewlist['id'].to_s 
        viewlist["images"] = user["curr_list_images"]
      end
      
    end
    
    viewlist["imageSet"]=[]
    
    if viewlist['images'] == nil
      viewlist['images'] = []
    end
    
    
    images = viewlist["images"]

      #get startIndex
      if params[:tarImage].to_s == '-1' 
        startIndex = 0
      else
        startIndex = 0
        images.each do|image|
          if image.to_s == params[:tarImage].to_s
            break
          end
          startIndex = startIndex+1
        end
      end
      
      if startIndex >= images.length
        startIndex = images.length-1
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = images[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          # if the target image is the last image, then append the second last to it and force the chunk to be backward
          if images == nil
            images = []
          end
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = viewlist["images"][startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end
          
        else
          images = images[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        

        
      #backward  
      else
        
        fromIndex = 0
        
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = images[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = images[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil or images.length == 0
        #defaultObj = @@contentDb['defaults'].find().to_a[0]
        #listObj = @@contentDb['viewlists'].find({'id'=>defaultObj['viewlist'].to_i}).to_a[0]
        #images = listObj['images']
        #viewlist['images'] = listObj['images']
        #viewlist['forward'] = 1
        #viewlist['tarIndex'] = 1
        #@@userDb['users'].update({'email'=>user['email']},{'$set'=>{'curr_list'=>defaultObj['viewlist'].to_i,
        #  'curr_image'=>defaultObj['image'].to_i, 'curr_cat'=>defaultObj['category']}})
        images = []
      end
    
    images.each do|image|
      if image.to_i.to_s == image.to_s
         image = image.to_i
      end   
      
      
      imageSet = getImageSet(image)
      if imageSet.count > 0
        
        
        imageObj = imageSet.to_a[0]
        if params[:email]!=nil
                      
           likeSet = @@userDb["imageLikes"].find({"id"=>image})
           if likeSet.count > 0
             likeObj = likeSet.to_a[0]
             if likeObj["likeMap"][user["id"].to_s]!= nil
               imageObj["like"]=true
             else
               imageObj["like"]=false
             end
             imageObj["likeNum"] = likeObj["likeNum"]             
           else
             imageObj["like"] = false
             imageObj["likeNum"] = 0
           end
           
           
          if imageObj['id'].to_i.to_s == imageObj['id'].to_s
            imageObj['id'] = imageObj['id'].to_i
          end   
           
           commentSet = @@userDb["imageComments"].find({"id"=>image})
           if commentSet.count > 0
             commentObj = commentSet.to_a[0]
           else
             commentObj = {"id"=>imageObj["id"], "commentNum"=>0,"comments"=>[]}
           end
           imageObj["commentNum"] = commentObj["commentNum"]
           imageObj["comments"] = commentObj["comments"][0...10]  
           
           
        end
        
        viewlist["imageSet"].append(imageObj)
      else   
         viewlist["imageNum"] = 0
         viewlist.delete("images")
         render :json=>viewlist, :callback => params[:callback]
         return     
      end
    end
    

    viewlist["imageNum"] = viewlist["images"].length
      if viewlist["imageNum"] > 0
          viewlist["startImage"] = viewlist["images"][0]
          viewlist["endImage"] = viewlist["images"][viewlist["imageNum"]-1]
      end
    viewlist.delete("images");
    render :json=>viewlist, :callback => params[:callback]
 
    
 
 
 end  
    
    
  def getViewlist6

    if(params[:id]==nil)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:id].length==0)
      result = {"result"=>"error, no id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    

    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    #userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase})
    if params[:email]!='guest@guest.guest' and userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    @@userDb['viewlist_records'].insert({'email'=>(params[:email].strip).downcase, 'viewlist'=>params[:id], 'time_stamp'=>utcMillis,'ip_address'=>request.remote_ip})
    
    if params[:email] == 'guest@guest.guest'
       user = {'curr_list'=>-1, 'shuffle'=>0, 'email'=>'guest@guest.guest'}
    else
    
       user = userSet.to_a[0]

    end
    
    
    if user["curr_list_images"]==nil
       user["curr_list_images"]=[]
    end      





    if(params[:id][0..7]=='topLiked')
      viewlist = {"id"=>params[:id], "name"=>"Most liked"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
                
      
      #get startIndex
      if params[:tarImage].to_s == '-1' or user['email'] == 'guest@guest.guest'
        if params[:catName]!=nil
          likeSet = @@userDb["imageLikes"].find({"likeNum"=>{"$gt"=>0}, "categories"=>params[:catName]}).sort({"likeNum"=>-1}).limit(100)
        else
          likeSet = @@userDb["imageLikes"].find({"likeNum"=>{"$gt"=>0}}).sort({"likeNum"=>-1}).limit(100)
        end
        
        dynImages = []
        likeSet.to_a.each do |likeObj|
          dynImages.push(likeObj["id"])
        end
        
        if params[:shuffle].to_i==1
           dynImages = dynImages.shuffle
        end
        
        
        startIndex = 0
      
        
        dynImages.each do|image|
          viewlist["images"].append(image)
        end
        
      else
        if user['curr_list_images']!= nil
           dynImages = user['curr_list_images']
        end
        startIndex = 0
        index = 0
        dynImages.each do|image|
          if image.to_s == params[:tarImage].to_s
            startIndex = index
          end
          viewlist["images"].append(image)
          index = index+1
        end
        
        
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = dynImages[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = dynImages[startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end          
          
        else
          images = dynImages[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        
        
      #backward  
      else
        
        fromIndex = 0
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = dynImages[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = dynImages[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil
        images = []
      end
      
      images.each do|image|      
        imageSet = getImageSet2(image,['id','icon','url', 'thumbnail','waterMark'])
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
 
           viewlist["imageSet"].append(imageObj)
        else
           viewlist["imageNum"] = 0
           viewlist.delete("images")
           render :json=>viewlist, :callback => params[:callback]
           return                
        end 
      
      end
      
      @@userDb["privLists"].remove({"id"=>params[:id]})
      @@userDb["privLists"].insert(viewlist)
      
      @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist['images'], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})   
      

      viewlist["imageNum"] = viewlist["images"].length
      if viewlist["imageNum"] > 0
          viewlist["startImage"] = viewlist["images"][0]
          viewlist["endImage"] = viewlist["images"][viewlist["imageNum"]-1]
      end
      viewlist.delete("images");

      render :json=>viewlist, :callback => params[:callback]
      return
    end
    
    
    
    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      if user['likeImages'] == nil
        user['likeImages'] = []
      end
          
      
      #get startIndex
      if params[:tarImage].to_s == '-1' 
        dynImages = user['likeImages']
        if params[:shuffle].to_i==1
           dynImages = dynImages.shuffle
        end
        
        
        startIndex = 0
      
        
        dynImages.each do|image|
          if image.to_i.to_s == image.to_s
            image = image.to_i
          end     
          viewlist["images"].append(image)
        end
        
      else
        if user['curr_list_images']!= nil
           dynImages = user['curr_list_images']
        end
        startIndex = 0
        index = 0
        dynImages.each do|image|
          if image.to_s == params[:tarImage].to_s
            startIndex = index
          end
          if image.to_i.to_s == image.to_s
            image = image.to_i
          end   
          viewlist["images"].append(image)
          index = index+1
        end
        
        
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = dynImages[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = dynImages[startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end          
          
        else
          images = dynImages[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        
        
      #backward  
      else
        
        fromIndex = 0
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = dynImages[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = dynImages[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil
        images = []
      end
      
      images.each do|image|      
        imageSet = getImageSet2(image,['id','icon','thumbnail','url','waterMark'])
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]

           viewlist["imageSet"].append(imageObj)
            
        else
           viewlist["imageNum"] = 0
           viewlist.delete("images")
           render :json=>viewlist, :callback => params[:callback]
           return               
             
        end 
      
      end
      
      
      @@userDb["privLists"].remove({"id"=>params[:id]})
      @@userDb["privLists"].insert(viewlist)
      @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist['images'], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})   
      

      viewlist["imageNum"] = viewlist["images"].length
      if viewlist["imageNum"] > 0
          viewlist["startImage"] = viewlist["images"][0]
          viewlist["endImage"] = viewlist["images"][viewlist["imageNum"]-1]
      end
      viewlist.delete("images");

      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    viewlistSet = getListSet(params[:id])
    
    if viewlistSet.count == 0
      result = {"Status"=>"failure", "Message"=>"unkown viewlist!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    
    
    
    viewlist = viewlistSet.to_a[0] 
    
    if params[:tarImage].to_s == '-1'
      #start over
      if params[:shuffle].to_i==1
         viewlist["images"] = viewlist["images"].shuffle
      end  
      
      
      if viewlist["id"].is_a? Numeric
          @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"].to_i,
          "shuffle"=>params[:shuffle].to_i}})
      else
          @@userDb["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"],
          "shuffle"=>params[:shuffle].to_i}})       
      end
      
         
      
    else
      #continuation do not re-shuffle
      if user['email']!= 'guest@guest.guest' and user["curr_list_images"] != nil and user["curr_list"].to_s == viewlist['id'].to_s 
        viewlist["images"] = user["curr_list_images"]
      end
      
    end
    
    viewlist["imageSet"]=[]
    
    if viewlist['images'] == nil
      viewlist['images'] = []
    end
    
    
    images = viewlist["images"]

      #get startIndex
      if params[:tarImage].to_s == '-1'
        startIndex = 0
      else
        startIndex = 0
        images.each do|image|
          if image.to_s == params[:tarImage].to_s
            break
          end
          startIndex = startIndex+1
        end
      end
      
      if startIndex >= images.length
        startIndex = images.length-1
      end
      
      viewlist["tarIndex"] = startIndex+1
      
      if params[:forward] == "1"
        if params[:include] == "1"
          images = images[startIndex..(startIndex+params[:numOfImg].to_i-1)]
          # if the target image is the last image, then append the second last to it and force the chunk to be backward
          if images == nil
            images = []
          end
          if images.length == 1 and viewlist["images"].length > 1
            viewlist["backward"]="1"
            images = viewlist["images"][startIndex-1..(startIndex+params[:numOfImg].to_i-1)]
          end
          
        else
          images = images[startIndex+1..(startIndex+params[:numOfImg].to_i)]
        end
        

        
      #backward  
      else
        
        fromIndex = 0
        
        
        
        if params[:include] == "1"
          if startIndex-params[:numOfImg].to_i+1 > 0
            fromIndex = startIndex-params[:numOfImg].to_i+1          
          end
          images = images[fromIndex..startIndex] 
            
        else
          if startIndex-params[:numOfImg].to_i > 0
            fromIndex = startIndex-params[:numOfImg].to_i          
          end
          images = images[fromIndex..startIndex-1] 
        end
        
        
      end
      
      
      
      if images == nil or images.length == 0
        defaultObj = @@contentDb['defaults'].find().to_a[0]
        listObj = @@contentDb['viewlists'].find({'id'=>defaultObj['viewlist'].to_i}).to_a[0]
        images = listObj['images']
        viewlist['images'] = listObj['images']
        viewlist['forward'] = 1
        viewlist['tarIndex'] = 1
        @@userDb['users'].update({'email'=>user['email']},{'$set'=>{'curr_list'=>defaultObj['viewlist'].to_i,
          'curr_image'=>defaultObj['image'].to_i, 'curr_cat'=>defaultObj['category']}})
        
      end
    
    images.each do|image|
      
      imageSet = getImageSet2(image,['id','icon','url','thumbnail','waterMark'])
      if imageSet.count > 0
        
        
        imageObj = imageSet.to_a[0]
        
        viewlist["imageSet"].append(imageObj)
      else
        viewlist["imageNum"] = 0
        viewlist.delete("images")
        render :json=>viewlist, :callback => params[:callback]
        return             
      end
    end
    

    viewlist["imageNum"] = viewlist["images"].length
      if viewlist["imageNum"] > 0
          viewlist["startImage"] = viewlist["images"][0]
          viewlist["endImage"] = viewlist["images"][viewlist["imageNum"]-1]
      end
    viewlist.delete("images");
    render :json=>viewlist, :callback => params[:callback]
 
    
 
 
 end      
    
    
    
end

  
