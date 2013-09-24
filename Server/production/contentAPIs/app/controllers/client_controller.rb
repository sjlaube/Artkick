class ClientController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'

  
  @@server = 'ds031948.mongolab.com'
  @@port = 31948
  @@db_name = 'zwamy'
  @@username = 'leonzwamy'
  @@password = 'zw12artistic'
  
  @@gmailAccount = 'leonzfarm'  
  @@gmailPassword = 'aljzcsjusqohrujk' 

  def utcMillis
    return (Time.new.to_f*1000).to_i
  end
  
  
  
  def login
    if(params[:email]==nil or params[:email].strip=='')
        result = {"status"=>"failure", "message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:password]==nil or params[:password]=='')
        result = {"status"=>"failure", "message"=>"password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase})
    
    if userSet.count == 0
        result = {"status"=>"failure", "message"=>"no user mathes!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"status"=>"failure", "message"=>"password is not set correctly, please reset your password via email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    passDigest = Digest::SHA1.hexdigest(params[:password]+user["salt"])
    if passDigest != user["pass_digest"]
        result = {"status"=>"failure", "message"=>"wrong password!"}
        render :json=>result, :callback => params[:callback]
        return  
    end    
    
     result = {"status"=>"success", "message"=>"user found!", "userObj"=>user}
    render :json=>result, :callback => params[:callback]
  end
  
  
  def resetPassword
    if(params[:email]==nil or params[:email].strip=='')
        result = {"status"=>"failure", "message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:oldpassword]==nil or params[:oldpassword].strip=='')
        result = {"status"=>"failure", "message"=>"old password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    if(params[:newpassword]==nil or params[:newpassword].strip=='')
        result = {"status"=>"failure", "message"=>"new password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end

   
    if(params[:oldpassword]==params[:newpassword])
        result = {"status"=>"failure", "message"=>"new password must be different from old passowrd!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase})
    
    if userSet.count == 0
        result = {"status"=>"failure", "message"=>"no user mathes!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    user = userSet.to_a[0]
    
    if user["salt"]==nil or user["pass_digest"]==nil
      result = {"status"=>"failure", "message"=>"Password has never been set for this account, please get your temporal password via email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    oldpassDigest = Digest::SHA1.hexdigest(params[:oldpassword]+user["salt"])
    if oldpassDigest != user["pass_digest"]
        result = {"status"=>"failure", "message"=>"wrong old password!"}
        render :json=>result, :callback => params[:callback]
        return  
    end    
    
    
    newsalt = rand(10000).to_s
    newpassDigest = Digest::SHA1.hexdigest(params[:newpassword]+newsalt)
    
    @db["users"].update({"email"=>(params[:email].strip).downcase},{"$set"=>{"salt"=>newsalt, "pass_digest"=>newpassDigest}})
    result = {"status"=>"success", "message"=>"Password is reset!"}
    render :json=>result, :callback => params[:callback]
  end
  
  
  def emailPassword
    if(params[:email]==nil or params[:email].strip=='')
        result = {"status"=>"failure", "message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase})
    if userSet.count == 0
        result = {"status"=>"failure", "message"=>"no user mathes!"}
        render :json=>result, :callback => params[:callback]
        return
    end 
    
    
    user = userSet.to_a[0]
    
    length = 6
    randomPassword = rand(36**length).to_s(36)
    
    newsalt = rand(10000).to_s
    newpassDigest = Digest::SHA1.hexdigest(randomPassword+newsalt)
    
    @db["users"].update({"email"=>(params[:email].strip).downcase},{"$set"=>{"salt"=>newsalt, "pass_digest" => newpassDigest}})
    
    result = {"status"=>"success", "message"=>"Your temporary password has been sent to your email, please reset it!"}
    render :json=>result, :callback => params[:callback]
    
    
    
    
    msgStr="From: ArtKick <info@artkick.com>\nTo: "+user["name"]+" <"+ (params[:email].strip).downcase+">\nSubject: Reset Your Password\n\nHi "+user["name"]+",\n\nThis is your temporary password:\n"+randomPassword+"\nplease reset it as soon as possible!\n\nBest regards,\nArtKick"
    
    smtp = Net::SMTP.new 'smtp.gmail.com', 587
    smtp.enable_starttls
    smtp.start("gmail.com", @@gmailAccount, @@gmailPassword, :login) do
      smtp.send_message(msgStr,"info@artkick.com",(params[:email].strip).downcase)
    end


    
    
    
    
    

    
  end
  
  
  def verifyUser
    if(params[:email]==nil or params[:email].strip=='')
        result = {"status"=>"failure", "message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase})
    
    if userSet.count == 0
        result = {"status"=>"failure", "message"=>"no user mathes!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    result = result = {"status"=>"success", "message"=>"user found!", "userObj"=>userSet.to_a[0]}
    render :json=>result, :callback => params[:callback]
  end
  
  
  
  def regUser
    if(params[:email]==nil or params[:email].strip=='')
        result = {"status"=>"failure", "message"=>"email missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:name]==nil or params[:name].strip=='')
        result = {"status"=>"failure", "message"=>"name missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    if(params[:password]==nil or params[:password]=='')
        result = {"status"=>"failure", "message"=>"password missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
          
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    if @db['users'].find({"email"=>(params[:email].strip).downcase}).count > 0
        result = {"status"=>"failure", "message"=>"This email has been registered!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    salt = rand(10000).to_s
    passDigest = Digest::SHA1.hexdigest(params[:password]+salt)
    
    
    
                       
    userObj = {"name"=>params[:name].strip,"email"=>(params[:email].strip).downcase}
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
    
    result = result = {"status"=>"success", "message"=>"user created!"}
    render :json=>result, :callback => params[:callback]        
  end
  
  
  def lastVisitsAll
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    result = {}
    @players = @db["clients"].find({}).to_a
    @players.each do |player|
      result[player["account"]]=player["last_visit"]
    end
    render :json =>result, :callback => params[:callback] 
  end
  
  
  def lastVisitsAllmq
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    result = {}
    @players = @db["clients"].find({}).to_a
    @players.each do |player|
      result[player["account"]]=player
    end
    render :json =>result, :callback => params[:callback] 
  end
  
  
  
  def lastVisits
    if(params[:snumbers]==nil)
      result = {"result"=>"error, no serial numbers!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:snumbers].length==0)
      result = {"result"=>"error, no serial numbers!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    result = {}
    params[:snumbers].each do|account|
      playerSet = @db['clients'].find({"account"=>account})
      if playerSet.count>0
        player = playerSet.to_a[0]
        result[account]=player["last_visit"]
      end
    end
    render :json=>result, :callback => params[:callback]    
  end  
  
  def players
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @players = @db['clients'].find().to_a
    @images = @db['images'].find().to_a
  end
  
  def update2    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password) 
       
    stretch = false
    if params[:stretch]!=nil
      stretch = params[:stretch]
    end
         
         newIndex = -1;
         listSet = @db['viewlists'].find({"id"=>params[:list].to_i})
         if listSet.count > 0
            list = listSet.to_a[0]
       
            index = 0
            while index < list["images"].length
               if list["images"][index].to_i == params[:imageID].to_i
                 newIndex = index-1
                 break
               end
               index += 1
            end
            
         end
    
    if params[:players] == nil
      params[:players] = []
    end
    params[:players].each do |account|
      
       playerSet = @db['clients'].find({"account"=>account})
       if playerSet.count > 0
         player = playerSet.to_a[0]
         currIndex = player["curr_index"]
         if newIndex != -1
            currIndex = newIndex
         end

         @db['clients'].update({"account"=>player["account"]},"$set"=>{"curr_image"=>params[:imageID].to_i,"image_time_stamp"=>utcMillis(), "stretch"=>stretch,
      "curr_list"=>params[:list], "curr_index"=>currIndex})
          
       end
       
    end
    
    @db['users'].update({"email"=>params[:email]},"$set"=>{"curr_image"=>params[:imageID],"curr_list"=>params[:list],"curr_cat"=>params[:cat], "fill"=>stretch})
    result = {"result"=>"success", "message"=>"updated!"}   
    render :json=>result, :callback => params[:callback]    
  end  
  
  
  
  def update
    if(params[:snumber]==nil or params[:imageID]==nil)
        result = {"result"=>"error", "message"=>"parameter missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    playerSet = @db['clients'].find({"account"=>params[:snumber]})
    if playerSet.count == 0
        result = {"result"=>"error", "message"=>"no player found!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    imageSet = @db['images'].find({"id"=>params[:imageID].to_i})
    if imageSet.count == 0
        result = {"result"=>"error", "message"=>"no image found!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    stretch = false
    if params[:stretch]!=nil
      stretch = params[:stretch]
    end


      
    
    player = playerSet.to_a[0]
    currIndex = player["curr_index"]
    
    listSet = @db['viewlists'].find({"id"=>params[:list].to_i})
    if listSet.count > 0
      list = listSet.to_a[0]
       
      index = 0
      while index < list["images"].length
        if list["images"][index].to_i == params[:imageID].to_i
          currIndex = index-1
          break
        end
        index += 1
      end
    end 
    
    
    @db['clients'].update({"account"=>params[:snumber]},"$set"=>{"curr_image"=>params[:imageID].to_i,"image_time_stamp"=>utcMillis(), "stretch"=>stretch,
      "curr_list"=>params[:list], "curr_index"=>currIndex})
      
    @db['users'].update({"email"=>params[:email]},"$set"=>{"curr_image"=>params[:imageID],"curr_list"=>params[:list],"curr_cat"=>params[:cat], "fill"=>stretch})
    result = {"result"=>"success", "message"=>"updated!"}   
    render :json=>result, :callback => params[:callback]
 
  end
  
  
  def allImages
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @images = @db["images"].find({}).to_a
    render :json=>@images, :callback => params[:callback]  
  end
  
  def allViewlists
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @viewlists = @db["viewlists"].find({}).to_a
    render :json=>@viewlists, :callback => params[:callback]  
 end
 
 def getViewlist2
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
    

    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      images = @db["imageRatings"].find({"user_email"=>params[:email].strip.downcase}).to_a
      
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
      
      images = images[startIndex..startIndex+9]
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
              viewlist["images"].append(image["img_id"].to_i)
           end
        end
      end
      
      @db["viewlists"].remove({"id"=>params[:id]})
      @db["viewlists"].insert(viewlist)
      
      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    
    viewlistSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}
      render :json=>result, :callback => params[:callback]
    end
    
    viewlist = viewlistSet.to_a[0] 
    viewlist["imageSet"]=[]
    
    
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
      
      images = images[startIndex..startIndex+9]
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
    
    
    render :json=>viewlist, :callback => params[:callback]
  end
 
 
 def RemoveCategory
    if params[:name] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)  
    
    if @db["categories"].find({"name"=>params[:name]}).count == 0
      result = {"Status"=>"failure", "Message"=>"Category doesn't exist!"}
      render :json=>result, :callback => params[:callback]
      return
    end   
    
    @db['categories'].remove({"name"=>params[:name]})
    @db['viewlists'].update({},{"$pull"=>{"categories"=>params[:name]}},opts={:upsert=>false, :multi=>true})  
    result = {"Status"=>"success", "Message"=>"Category "+params[:name]+" is removed!"}
    render :json=>result, :callback => params[:callback]  
 end
 
 def CreateCategory
    if params[:name] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
    
    if @db["categories"].find({"name"=>params[:name]}).count > 0
      result = {"Status"=>"failure", "Message"=>params[:name]+" has been taken, please try another name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    catObj = {'name'=>params[:name], 'viewlists'=>[]}
    @db["categories"].insert(catObj)
    result = {"Status"=>"success","Message"=>"Category "+params[:name]+" is created!"}
    render :json=>result, :callback => params[:callback]      
 end
 
 def CreateViewlist
    if params[:listName] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:catName] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
 
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
       
    if @db["categories"].find({"name"=>params[:catName]}).count == 0  
      result = {"Status"=>"failure","Message"=>"Cateogry doesn't exit!"}
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    currIndex = @db['index'].find().to_a[0]['viewlist'].to_i+1
    
    listObj = {'name'=>params[:listName], 'categories'=>[params[:catName]], 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>[]}
      
    @db['viewlists'].insert(listObj)
    @db['categories'].update({'name'=>params[:catName]},{'$push'=>{'viewlists'=>currIndex}})
    @db['index'].update({},{'$set'=>{'viewlist'=>currIndex}})
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>currIndex}
    render :json=>result, :callback => params[:callback] 
 end
 
 
 def RemoveViewlistFromCategory

    if params[:listId] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:catName] == nil
      result = {"Status"=>"failure","Message"=>"No category name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
 
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)   
   
    if @db["categories"].find({"name"=>params[:catName]}).count == 0  
      result = {"Status"=>"failure","Message"=>"Cateogry doesn't exit!"}
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    if @db["viewlists"].find({"id"=>params[:listId].to_i}).count == 0  
      result = {"Status"=>"failure","Message"=>"Viewlist doesn't exit!"}
      render :json=>result, :callback => params[:callback]
      return
    end  
    
    @db['viewlists'].update({"id"=>params[:listId].to_i},{'$pull'=>{'categories'=>params[:catName]}})
    @db['categories'].update({"name"=>params[:catName]},{'$pull'=>{'viewlists'=>params[:listId].to_i}})
    
    trashLists = @db['trashes'].find({'type'=>'viewlists'}).to_a[0]['viewlists']
    if not trashLists.include?params[:listId].to_i
      @db['trashes'].update({'type'=>'viewlists'},{'$push'=>{'viewlists'=>params[:listId].to_i}})
    end
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listId]+" is removed from Category "+
      params[:catName]+"!"}
    
   render :json=>result, :callback => params[:callback]
 end
 
 
 
 def AddImagesToViewlist
   if params[:images] == nil
     result = {"Status"=>"failure", "Message"=>"No image ids!"}
     render :json=>result, :callback => params[:callback]
     return     
   end
   
   if params[:listId] == nil
     result = {"Status"=>"failure", "Message"=>"No viewlist id!"}
     render :json=>result, :callback => params[:callback]
     return     
   end
   
   @client = MongoClient.new(@@server,@@port)
   @db = @client[@@db_name]
   @db.authenticate(@@username,@@password)  
   
   listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
   if listSet.count == 0
     result = {"Status"=>"failure","Message"=>"Viewlist not found!"}
     render :json=>result, :callback => params[:callback]
     return 
   end
   
   listObj = listSet.to_a[0]
   added = []
   
   params[:images].each do |imageId|
     if @db['images'].find({'id'=>imageId.to_i}).count >0 and not listObj['images'].include?imageId.to_i
          @db['viewlists'].update({'id'=>params[:listId].to_i},{'$push'=>{'images'=>imageId.to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists'=>params[:listId].to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists2'=>[params[:listId].to_i,listObj['name']]}})
          added.push(imageId.to_s)       
     end
     
     
   end
   message = 'Images '+added.join(',')+' are added to Viewlist '+params[:listId].to_s+'!'
   result = {'Status'=>'success','Message'=>message}
   render :json=>result, :callback => params[:callback]
 end
 
 
 
 def RemoveImagesFromViewlist
    if params[:images] == nil
      result = {"Status"=>"failure","Message"=>"No image ids!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:listId] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password) 


   listSet = @db['viewlists'].find({'id'=>params[:listId].to_i})
   if listSet.count == 0
     result = {"Status"=>"failure","Message"=>"Viewlist not found!"}
     render :json=>result, :callback => params[:callback]
     return 
   end
   
   listObj = listSet.to_a[0]
   removed = []  
     
   params[:images].each do |imageId|
     if @db['images'].find({'id'=>imageId.to_i}).count >0 and listObj['images'].include?imageId.to_i
          @db['viewlists'].update({'id'=>params[:listId].to_i},{'$pull'=>{'images'=>imageId.to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists'=>params[:listId].to_i}})
          @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists2'=>[params[:listId].to_i,listObj['name']]}})
          
          trashImages = @db['trashes'].find({'type'=>'images'}).to_a[0]['images']
          if not trashImages.include?imageId.to_i
             @db['trashes'].update({'type'=>'images'},{'$push'=>{'images'=>imageId.to_i}})
          end
          removed.push(imageId.to_s)       
     end
     
     
   end   
   
    message = 'Images '+removed.join(',')+' are removed from Viewlist '+params[:listId].to_s+'!'   
    result = {"Status"=>"success","Message"=>message}
    render :json=>result, :callback => params[:callback]
 end
 
 def SaveImgAttr   
    if(params[:id]==nil)
      result = {"Status"=>"failure","Message"=>"No image id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    imageSet = @db["images"].find({"id"=>params[:id].to_i})
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No image found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    hiddenAttrs = {"id"=>1,"callback"=>1,"controller"=>1,"action"=>1}
    
    result = {"Status"=>"success"}
    setHash = {}
    params.each do |key, value|
      if not hiddenAttrs.has_key?(key)
        setHash[key] = value
      end
    end
    @db["images"].update({"id"=>params[:id].to_i},{"$set"=>setHash})
    render :json=>result, :callback => params[:callback]
 end
 
 
 def RenameCategory
    if params[:oldname] == nil
      result = {"Status"=>"failure","Message"=>"No old name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:newname] == nil
      result = {"Status"=>"failure","Message"=>"No new name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:newname] == params[:oldname]
      result = {"Status"=>"success","Message"=>"Category has been renamed!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    catSet = @db["categories"].find({"name"=>params[:oldname]})
    if catSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No category found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if @db["categories"].find({"name"=>params[:newname]}).count > 0
      result = {"Status"=>"failure", "Message"=>params[:newname]+" has been taken, please try another name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    catObj = catSet.to_a[0]
    catObj["viewlists"].each do|listId|
      @db["viewlists"].update({"id"=>listId.to_i},{'$pull'=>{'categories'=>params[:oldname]}})
      @db["viewlists"].update({"id"=>listId.to_i},{'$push'=>{'categories'=>params[:newname]}})
    end
    
    @db["categories"].update({"name"=>params[:oldname]},{"$set"=>{"name"=>params[:newname]}})

    result = {"Status"=>"success", "Message"=>"Category has been renamed!"}
    render :json=>result, :callback => params[:callback]
  end
 
 
 
 def GetViewlistMeta
    if params[:id] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    listSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No viewlist found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    result = {"Status"=>"success", "Viewlist"=>listSet.to_a[0]}
    render :json=>result, :callback => params[:callback]
  end
  
  def RenameViewlist
    if params[:id] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if params[:name] == nil
      result = {"Status"=>"failure","Message"=>"No viewlist name!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    listSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No viewlist found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    listObj = listSet.to_a[0]
    listObj['images'].each do |imageId|
      @db['images'].update({'id'=>imageId.to_i},{'$pull'=>{'viewlists2'=>[listObj['id'].to_i,listObj['name']]}})
      @db['images'].update({'id'=>imageId.to_i},{'$push'=>{'viewlists2'=>[listObj['id'].to_i,params[:name]]}})
    end
    
    @db["viewlists"].update({"id"=>params[:id].to_i},{"$set"=>{"name"=>params[:name]}})
    result = {"Status"=>"success", "Message"=>"Viewlist name has been updated!"}
    render :json=>result, :callback => params[:callback]
  end
 
 
 
 def getImage
   if params[:id]==nil
      result = {"Status"=>"failure","Message"=>"No image id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    imageSet = @db["images"].find({"id"=>params[:id].to_i})
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No image found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    result = {"Status"=>"success", "Image"=>imageSet.to_a[0]}
    render :json=>result, :callback => params[:callback]
 end
 
 def getViewlist
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
    

    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    

    if(params[:id][0..2]=='top')
      viewlist = {"id"=>params[:id], "name"=>"My Top Rated"}
      viewlist["imageSet"]=[]
      viewlist["images"]=[]
      
      images = @db["imageRatings"].find({"user_email"=>params[:email].strip.downcase}).to_a
      
      
      
      images.each do|image|      
        imageSet = @db["images"].find({"id"=>image["img_id"].to_i})
        if imageSet.count > 0
           imageObj = imageSet.to_a[0]
           imageObj["User Rating"]=image["rating"]

           if image["rating"].to_i > 0
              viewlist["imageSet"].append(imageObj)
              viewlist["images"].append(image["img_id"].to_i)
           end
        end
      end
      
      @db["viewlists"].remove({"id"=>params[:id]})
      @db["viewlists"].insert(viewlist)
      viewlist.delete("_id")
      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    
    viewlistSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}
      render :json=>result, :callback => params[:callback]
    end
    
    viewlist = viewlistSet.to_a[0] 
    viewlist["imageSet"]=[]
    
    
    
    viewlist["images"].each do|image|
      
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
    
    viewlist.delete("_id")
    render :json=>viewlist, :callback => params[:callback]
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
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
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
    render :json=>result, :callback => params[:callback]
    
    
  end
  
  def getPlayer
    if(params[:snumber]==nil)
      result = {"result"=>"error, no serial number!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:snumber].length==0)
      result = {"result"=>"error, no serial number!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    playerSet = @db["clients"].find({"account"=>params[:snumber]})
    if playerSet.count == 0
      result = {"result"=>"unkown player"}
      render :json=>result, :callback => params[:callback]
    end
    render :json=>playerSet.to_a[0], :callback => params[:callback] 
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
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    userSet = @db["users"].find({"email"=>params[:email]})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      render :json=>result, :callback => params[:callback]
      return 
    end
    
    @db["users"].update({"email"=>params[:email]},{"$set"=>{"selected_players"=>params[:players]}})
    result = {"Status"=>"success", "Message"=>"The players are selected!"}
    render :json=>result, :callback => params[:callback]
    
  end
  
  def getSelectedPlayers
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    userSet = @db["users"].find({"email"=>params[:email]})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      render :json=>result, :callback => params[:callback]
      return 
    end
    
    selectedPlayers = userSet.to_a[0]["selected_players"]
    result = {"Status"=>"success", "selectedPlayers"=>selectedPlayers}
    render :json=>result, :callback => params[:callback] 
  end
  
  
   def getUserStatus
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No user email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    userSet = @db["users"].find({"email"=>params[:email]})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      render :json=>result, :callback => params[:callback]
      return 
    end
    
    user = userSet.to_a[0]
    if(user["curr_image"]==nil or user["curr_image"]=='') or (@db["images"].find({"id"=>user["curr_image"].to_i}).count==0)
      result = {"Status"=>"failure", "Message"=>"No image!"}
      render :json=>result, :callback => params[:callback]
      return  
    end
    
    if(user["curr_list"]==nil or user["curr_list"]=='') or ((@db["viewlists"].find({"id"=>user["curr_list"]}).count==0)and(@db["viewlists"].find({"id"=>user["curr_list"].to_i}).count==0))
      result = {"Status"=>"failure", "Message"=>"No list!"}
      render :json=>result, :callback => params[:callback]
      return  
    end
    
    if(user["curr_cat"]==nil or user["curr_cat"]=='') or (@db["categories"].find({"name"=>user["curr_cat"]}).count==0)
      result = {"Status"=>"failure", "Message"=>"No category!"}
      render :json=>result, :callback => params[:callback]
      return  
    end
    
    
    
    result = {"Status"=>"success", "curr_image"=>user["curr_image"], "curr_list"=>user["curr_list"],"curr_cat"=>user["curr_cat"],
      "fill"=>user["fill"], "autoInterval"=>user["autoInterval"]}
    render :json=>result, :callback => params[:callback]
    
  end
  
  
  def setAuto
    if(params[:snumber]==nil or params[:autoInterval]==nil or params[:snumber].strip=='' or params[:autoInterval].strip=='')
        result = {"Status"=>"failure", "message"=>"parameter(s) missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)

    playerSet = @db['clients'].find({"account"=>params[:snumber].strip})
    if playerSet.count == 0
        result = {"Status"=>"failure", "message"=>"no player found!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    player=playerSet.to_a[0]
    currIndex = player["curr_index"]
    if currIndex == nil
      currIndex = -1
    end

    @db['clients'].update({"account"=>params[:snumber].strip},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i, "lastAutoAssign"=>-1,
      "curr_index"=>currIndex, "auto_user"=>params[:email]}})
      
    @db['users'].update({"email"=>params[:email]},{"$set"=>{"autoInterval"=>params[:autoInterval].strip.to_i}})

    result = {"Status"=>"success", "message"=>"updated!"}   
    render :json=>result, :callback => params[:callback]
 
  end
  
  def getDefault
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    defaultObjSet = @db['defaults'].find()
    if defaultObjSet.count == 0
        result = {"Status"=>"failure", "message"=>"no defaults found!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    result = {"Status"=>"success", "defaults"=>defaultObjSet.to_a[0]}   
    render :json=>result, :callback => params[:callback]
    
  end
 
 
 
 
 
 def getViewlist3

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
    

    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
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
      render :json=>viewlist, :callback => params[:callback]
      return
    end
    

    
    
    
    viewlistSet = @db["viewlists"].find({"id"=>params[:id].to_i})
    if viewlistSet.count == 0
      result = {"result"=>"unkown viewlist"}
      render :json=>result, :callback => params[:callback]
    end
    
    viewlist = viewlistSet.to_a[0] 
    viewlist["imageSet"]=[]
    
    
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
    
    
    render :json=>viewlist, :callback => params[:callback]
 
 
 
 
 end 
 
  
    
end  
