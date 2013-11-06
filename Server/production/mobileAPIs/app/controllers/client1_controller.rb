class Client1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'
  require 'curb'
  require 'securerandom'
  
  #@@server = 'ds031948.mongolab.com'
  #@@port = 31948
  #@@db_name = 'zwamy'
  #@@username = 'leonzwamy'
  #@@password = 'zw12artistic'
  
  #@@server = 'ds047478.mongolab.com'
  #@@port = 47478
  #@@db_name = 'heroku_app16778260'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'

  #@@server = 'ds051518-a0.mongolab.com'
  #@@port = 51518
  #@@db_name = 'heroku_app16777800'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'
  
  #singleNode2
  @@server = 'ds053468-a0.mongolab.com'
  @@port = 53468
  @@db_name = 'heroku_app16778260'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'   
  
  @@gmailAccount = 'leonzfarm'  
  @@gmailPassword = 'aljzcsjusqohrujk' 
  
  @@api_key = '7c028a32e596566b2632e6f672df55af-us7' 

  def utcMillis
    return (Time.new.to_f*1000).to_i
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
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','salt','pass_digest','tokens']})
    
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no user mathes!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"Status"=>"failure", "Message"=>"password is not set correctly, please reset your password via email!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    passDigest = Digest::SHA1.hexdigest(params[:password]+user["salt"])
    if passDigest != user["pass_digest"]
        result = {"Status"=>"failure", "Message"=>"wrong password!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return  
    end    
    
    sessionToken = SecureRandom.hex
    if user['tokens'] == nil
      @db['users'].update({'email'=>params[:email].strip.downcase},{'$set'=>{'tokens'=>[sessionToken]}})
    else
      if user['tokens'].length == 5
        user['tokens'].shift 
      end
      
      user['tokens'].push(sessionToken)
      @db['users'].update({'email'=>params[:email].strip.downcase},{'$set'=>{'tokens'=>user['tokens']}})
    end
        
    result = {"Status"=>"success", "Message"=>"user found!", "userObj"=>{'name'=>user['name']}, "token"=>sessionToken}
    @client.close
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
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase})
    
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no user mathes!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"Status"=>"failure", "Message"=>"Password has never been set for this account, please get your temporal password via email!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    oldpassDigest = Digest::SHA1.hexdigest(params[:oldpassword]+user["salt"])
    if oldpassDigest != user["pass_digest"]
        result = {"Status"=>"failure", "Message"=>"wrong old password!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return  
    end    
    
    
    newsalt = rand(10000).to_s
    newpassDigest = Digest::SHA1.hexdigest(params[:newpassword]+newsalt)
    
    @db["users"].update({"email"=>(params[:email].strip).downcase},{"$set"=>{"salt"=>newsalt, "pass_digest"=>newpassDigest}})
    result = {"Status"=>"success", "Message"=>"Password is reset!"}
    @client.close
    render :json=>result, :callback => params[:callback]
  end
  
  
  def emailPassword
    if(params[:email]==nil or params[:email].strip=='')
        result = {"Status"=>"failure", "Message"=>"email is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
              
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    user = userSet.to_a[0]
    
    length = 6
    randomPassword = rand(36**length).to_s(36)
    
    newsalt = rand(10000).to_s
    newpassDigest = Digest::SHA1.hexdigest(randomPassword+newsalt)
    
    @db["users"].update({"email"=>(params[:email].strip).downcase},{"$set"=>{"salt"=>newsalt, "pass_digest" => newpassDigest}})
    
    result = {"Status"=>"success", "Message"=>"Your temporary password has been sent to your email, please reset it!"}
    @client.close
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
          
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    if @db['users'].find({"email"=>(params[:email].strip).downcase}).count > 0
        result = {"Status"=>"failure", "Message"=>"This email is taken, please use a different email!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    salt = rand(10000).to_s
    passDigest = Digest::SHA1.hexdigest(params[:password]+salt)
    
    sessionToken = SecureRandom.hex
    
                       
    userObj = {"name"=>params[:name].strip,"email"=>(params[:email].strip).downcase, "tokens"=>[sessionToken]}
    currIndex = @db['index'].find().to_a[0]['user']
    userObj["id"] = currIndex+1
    
    userObj["salt"]=salt
    userObj["pass_digest"]=passDigest
    
    emptyArrays = ["images","viewlists","friends","adds","requests","owned_clients",
                    "playable_clients","plays"]
    
    for emptyArray in emptyArrays
        userObj[emptyArray]=[]
    end 
    
       
    @db['users'].insert(userObj)
    @db['index'].update({},{"$set"=>{"user"=>currIndex+1}})
    
    
    
    result = {"Status"=>"success", "Message"=>"user created!", "token"=>sessionToken}
    @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
       
    stretch = false
    if params[:stretch]!=nil
      stretch = params[:stretch]
    end
         
    listSet = @db['viewlists'].find({"id"=>params[:list].to_i})
    if listSet.count == 0
       listSet = @db['viewlists'].find({"id"=>params[:list]})
    end

         
    if listSet.count > 0 
       list = listSet.to_a[0]
       if userSet.count >0 
          user = userSet.to_a[0]
          if user["curr_list_images"] != nil and user["curr_list"].to_i==params[:list].to_i
             list["images"] = user["curr_list_images"]
          end
       end
        
       
       currIndex = 0
       while currIndex < list["images"].length
          if list["images"][currIndex].to_i == params[:imageID].to_i
             break
          end
             currIndex += 1
          end
            
   end
    
   if params[:players] == nil
      params[:players] = []
   end
   params[:players].each do |account|
      
       playerSet = @db['clients'].find({"account"=>account})
       if playerSet.count > 0
         player = playerSet.to_a[0]
         currListImages = []
         if list["images"] != nil
           currListImages = list["images"]
         end
         @db['clients'].update({"account"=>player["account"]},"$set"=>{"curr_image"=>params[:imageID].to_i,"image_time_stamp"=>utcMillis(), "stretch"=>stretch,
      "curr_list"=>params[:list], "curr_index"=>currIndex, "curr_list_images"=>currListImages, "curr_user"=>params[:email]})
          
       end
       
    end
    
    @db['users'].update({"email"=>params[:email]},"$set"=>{"curr_image"=>params[:imageID],"curr_list"=>params[:list],"curr_cat"=>params[:cat], "fill"=>stretch,
      "curr_list_images"=>list["images"], "last_visit"=>utcMillis()})
      
      
    result = {"result"=>"success", "Message"=>"updated!"}   
    @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    if @db["imageRatings"].find({"img_id"=>params[:imageId].to_i, "user_email"=>params[:email].strip.downcase}).count > 0
      if params[:rating].to_i > 0
        @db["imageRatings"].update({"img_id"=>params[:imageId].to_i, "user_email"=>params[:email].strip.downcase},{"$set"=>{"rating"=>params[:rating].to_i}})
      else
        @db["imageRatings"].remove({"img_id"=>params[:imageId].to_i, "user_email"=>params[:email].strip.downcase})
      end
      
    else
      @db["imageRatings"].insert({"img_id"=>params[:imageId].to_i, "user_email"=>params[:email].strip.downcase, "rating"=>params[:rating].to_i})
    end
    result = {"result"=>"rating updated!"}
    @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    @db["users"].update({"email"=>params[:email]},{"$set"=>{"selected_players"=>params[:players]}})
    result = {"Status"=>"success", "Message"=>"The players are selected!"}
    @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    selectedPlayers = userSet.to_a[0]["selected_players"]
    result = {"Status"=>"success", "selectedPlayers"=>selectedPlayers}
    @client.close
    render :json=>result, :callback => params[:callback] 
  end
  
  
   def getUserStatus
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    user = userSet.to_a[0]
    if(user["curr_image"]==nil or user["curr_image"]=='') or (@db["images"].find({"id"=>user["curr_image"].to_i}).count==0)
      result = {"Status"=>"failure", "Message"=>"No image!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return  
    end
    
    if(user["curr_list"]==nil or user["curr_list"]=='') or ((@db["viewlists"].find({"id"=>user["curr_list"]}).count==0)and(@db["viewlists"].find({"id"=>user["curr_list"].to_i}).count==0))
      result = {"Status"=>"failure", "Message"=>"No list!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return  
    end
        
    
    shuffle = "false"
    if user["shuffle"] == 1
      shuffle = "true"
    end
    result = {"Status"=>"success", "curr_image"=>user["curr_image"], "curr_list"=>user["curr_list"],"curr_cat"=>user["curr_cat"],
      "fill"=>user["fill"], "autoInterval"=>user["autoInterval"], "shuffle"=>shuffle}
    @client.close
    render :json=>result, :callback => params[:callback]
    
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 

    playerSet = @db['clients'].find({"account"=>params[:snumber].strip})
    if playerSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no player found!"}
        @client.close
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
      userSet = @db['users'].find({'id'=>player['owner'].to_i})
      if userSet.count > 0
        userObj = userSet.to_a[0]
        autoUser = userObj['email']
      end
    end

    @db['clients'].update({"account"=>params[:snumber].strip},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i, "lastAutoAssign"=>-1,
      "curr_index"=>currIndex, "auto_user"=>autoUser}})
      
    @db['users'].update({"email"=>params[:email]},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i}})

    result = {"Status"=>"success", "Message"=>"updated!"}   
    @client.close
    render :json=>result, :callback => params[:callback]
 
  end
  
  def getDefault
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    defaultObjSet = @db['defaults'].find()
    if defaultObjSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no defaults found!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    result = {"Status"=>"success", "defaults"=>defaultObjSet.to_a[0]}   
    @client.close   
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    user = userSet.to_a[0]
    if user["curr_list_images"]==nil
      listSet = @db["viewlists"].find({"id"=>user["curr_list".to_i]})
      if listSet.count > 0
        list = listSet.to_a[0]
        user["curr_list_images"]=list["images"]
        @db["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>list["images"]}})
        
      end
      
    end
    
    
    
    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      dynImages = @db["imageRatings"].find({"user_email"=>params[:email].strip.downcase}).to_a
      
      #get startIndex
      if params[:tarImage].to_i == -1 
        
        startIndex = 0
        dynImages.each do|image|
          viewlist["images"].append(image["img_id"].to_i)
        end
        
      else
        startIndex = 0
        index = 0
        dynImages.each do|image|
          if image["img_id"] == params[:tarImage].to_i
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
        imageSet = @db["images"].find({"id"=>image["img_id"].to_i})
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
           imageObj["User Rating"]=image["rating"]

           if image["rating"].to_i > 0
              viewlist["imageSet"].append(imageObj)
              
           else
             @db["imageRatings"].remove({"user_email"=>params[:email].strip.downcase, "img_id"=>image["img_id"].to_i})
           end
           
        else
          @db["imageRatings"].remove({"user_email"=>params[:email].strip.downcase, "img_id"=>image["img_id"].to_i})
          
        end 
        
      
      end
      
      @db["viewlists"].remove({"id"=>params[:id]})
      @db["viewlists"].insert(viewlist)
      viewlist["dynImages"]=images
      @db["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})   
      
      @client.close
      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    
    viewlistSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}
      @client.close
      render :json=>result, :callback => params[:callback]
    end
    
    
    
    
    
    viewlist = viewlistSet.to_a[0] 
    
    if viewlist["id"].to_i == user["curr_list"].to_i and user["shuffle"] == params[:shuffle].to_i
      viewlist["images"] = user["curr_list_images"]
    else
      if params[:shuffle].to_i==1
         viewlist["images"] = viewlist["images"].shuffle
      end
      
      @db["users"].update({"email"=>user["email"]},{"$set"=>{"curr_list_images"=>viewlist["images"], "curr_list"=>viewlist["id"],
      "shuffle"=>params[:shuffle].to_i}})      
      
      
    end
  
    
    viewlist["imageSet"]=[]
    
    if params[:array] != nil
      viewlist["images"] = params[:array]
    end
    
    
    images = viewlist["images"]

      #get startIndex
      if params[:tarImage].to_i == -1 
        startIndex = 0
      else
        startIndex = 0
        images.each do|image|
          if image == params[:tarImage].to_i
            break
          end
          startIndex = startIndex+1
        end
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
      
      imageSet = @db["images"].find({"id"=>image.to_i})
      if imageSet.count > 0
        
        
        imageObj = imageSet.to_a[0]
        if params[:email]!=nil
           ratingSet = @db["imageRatings"].find({"img_id"=>image.to_i,"user_email"=>(params[:email].strip).downcase})
           if ratingSet.count> 0
             ratingObj = ratingSet.to_a[0]
             imageObj["User Rating"]=ratingObj["rating"]
           end
        end
        
        viewlist["imageSet"].append(imageObj)
      end
    end
    
    @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
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
    @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip},{:fields=>['name']})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    result = result = {"Status"=>"success", "Message"=>"user found!", "userObj"=>userSet.to_a[0]}
    @client.close
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
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase},{:fields=>['name','salt','pass_digest','tokens','private_lists','owned_clients','email']})
    
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"no user mathes!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"Status"=>"failure", "Message"=>"wrong password!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    passDigest = Digest::SHA1.hexdigest(params[:password]+user["salt"])
    if passDigest != user["pass_digest"]
        result = {"Status"=>"failure", "Message"=>"wrong password!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return  
    end        
  
    # remove private lists
    if user['private_lists'] != nil
       user['private_lists'].each do |listId|
           @db['viewlists'].remove({'id'=>listId.to_i})
       end 
    
    end
    
    # remove devices
    user['owned_clients'].each do |account|
      playerSet = @db['clients'].find({'account'=>account},{:fields=>["account","playable_users"]})
      if playerSet.count > 0
        player = playerSet.to_a[0]
        player["playable_users"].each do |userId|
          @db['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>player["account"]}})
          @db['users'].update({"id"=>userId.to_i},{"$pull"=>{"playable_clients"=>player["account"]}})
        end
        @db['clients'].remove({'account'=>account})
      end
    end

    @db['users'].remove({'email'=>user['email']}) 
    
    result = result = {"Status"=>"success", "Message"=>"user has been removed!"}
    @client.close
    render :json=>result, :callback => params[:callback]
    
    
    end
    
  
    
end

  
