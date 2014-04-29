class ClientController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'json'
  
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
  
  
  def utcMillis
    return (Time.new.to_f*1000).to_i
  end
  
  def checkin
   if(params[:snumber]==nil)
      result = {"result"=>"error", "message"=>"no serial number!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    defaultObj = @db['defaults'].find().to_a[0]
    
    if @db['clients'].find({'account'=>params[:snumber]}).count == 0
      result = {"result"=>"error", "message"=>"no player found!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @player = @db['clients'].find({'account'=>params[:snumber]}).to_a[0]
    utctime = utcMillis()
    
    image_time_stamp = @player["image_time_stamp"]
    if image_time_stamp == nil
      image_time_stamp = utctime
    end
    
    stretch = "false"
    if @player["stretch"] != nil
       stretch = @player["stretch"].to_s
    end
    
    if utctime - image_time_stamp > 30*60000
      pullInterval = 4000
    else
      pullInterval = 500
    end
    
    
    

    
    
    if @player["autoInterval"].to_i == -1  #every morning
      
      if @player['lastMorning']==nil
        @player['lastMorning']==-1
      end
      
      
      #targetTime = @player["lastMorning"].to_i+24*3600000
      if (Time.new.utc.hour==9) and (utctime-@player['lastMorning'].to_i>3600000)        
         lastMorning = utctime
         
         listSet = @db['viewlists'].find({"id"=>@player["curr_list"].to_i})
         if listSet.count == 0
           listSet = @db['viewlists'].find({"id"=>@player["curr_list"]})
           if listSet.count > 0
              currListObj = listSet.to_a[0]
           else
              currListObj = @db['viewlists'].find({"id"=>defaultObj["viewlist"]}).to_a[0]
           end
         else
           currListObj = listSet.to_a[0]
         end
         
         images = currListObj["images"]
         
         if @player["curr_list_images"]!=nil and @player["curr_list_images"].length>0
           images = @player["curr_list_images"]
         end
         
         currIndex = (@player["curr_index"].to_i + 1)%images.length
         currImageIndex = images[currIndex]
             
    
         imageSet = @db['images'].find({'id'=>currImageIndex.to_i})
         if imageSet.count > 0
           currImage = imageSet.to_a[0]
         else
           currImage = @db["images"].find({"id"=>defaultObj['image']})
         end 
         

    
         stretch = "false"
         if @player["stretch"] != nil
           stretch = @player["stretch"].to_s
         end
         
         @db['clients'].update({'account'=>params[:snumber]},"$set"=>{'last_visit'=>utctime,
           'curr_index'=>currIndex, 'lastMorning'=>lastMorning, 'curr_image'=>currImage["id"]})
           
         if @player["auto_user"] != nil
           @db['users'].update({"email"=>@player["auto_user"]},"$set"=>{"curr_image"=>currImage["id"],"curr_list"=>@player["curr_list"],"curr_list_images"=>images})
         end
                     
         result = {"result"=>"success", "message"=>"updated "+utctime.to_s+" "+@player["nickname"], "player"=>@player["nickname"],
               "currImage"=>currImage, "image_time_stamp"=>image_time_stamp,'nextPull'=>pullInterval, 'stretch'=>stretch}    
         @client.close
         render :json=>result, :callback => params[:callback]     
  
         
         return
         
      end
      
    end
    
    
    
    
    if @player["autoInterval"].to_i > 0
      
      targetTime = @player["lastAutoAssign"].to_i+@player["autoInterval"].to_i
      #targetTime = @player["lastAutoAssign"].to_i+4000
      
      if (@player["lastAutoAssign"].to_i == -1) or (utctime > targetTime) or (targetTime >= utctime and targetTime <= (utctime+pullInterval))
        
         lastAutoAssign = utctime
         
         listSet = @db['viewlists'].find({"id"=>@player["curr_list"].to_i})
         if listSet.count == 0
           listSet = @db['viewlists'].find({"id"=>@player["curr_list"]})
           if listSet.count > 0
              currListObj = listSet.to_a[0]
           else
              currListObj = @db['viewlists'].find({"id"=>defaultObj["viewlist"]}).to_a[0]
           end
         else
           currListObj = listSet.to_a[0]
         end
         
         images = currListObj["images"]
         
         if @player["curr_list_images"]!=nil and @player["curr_list_images"].length>0
           images = @player["curr_list_images"]
         end         
         
         
         currIndex = (@player["curr_index"].to_i + 1)%images.length
         currImageIndex = images[currIndex]
             
    
         imageSet = @db['images'].find({'id'=>currImageIndex.to_i})
         if imageSet.count > 0
           currImage = imageSet.to_a[0]
         else
           currImage = @db["images"].find({"id"=>defaultObj['image']})
         end 
         
    
         stretch = "false"
         if @player["stretch"] != nil
           stretch = @player["stretch"].to_s
         end
         
         @db['clients'].update({'account'=>params[:snumber]},"$set"=>{'last_visit'=>utctime,
           'curr_index'=>currIndex, 'lastAutoAssign'=>lastAutoAssign, 'curr_image'=>currImage["id"]})
           
         if @player["auto_user"] != nil
           @db['users'].update({"email"=>@player["auto_user"]},"$set"=>{"curr_image"=>currImage["id"],"curr_list"=>@player["curr_list"],"curr_list_images"=>images})
         end
                     
         result = {"result"=>"success", "message"=>"updated "+utctime.to_s+" "+@player["nickname"], "player"=>@player["nickname"],
               "currImage"=>currImage, "image_time_stamp"=>image_time_stamp, 'nextPull'=>pullInterval, 'stretch'=>stretch}    
        
         @client.close       
         render :json=>result, :callback => params[:callback] 
         
         return
         
      end
      
      
    end
    

    currImageIndex = defaultObj['image']
    if @player["curr_image"].to_i != -1
      currImageIndex = @player["curr_image"].to_i
    end
    
    imageSet = @db['images'].find({'id'=>currImageIndex.to_i})
    if imageSet.count > 0
      currImage = imageSet.to_a[0]
    end
    
    
    @db['clients'].update({'account'=>params[:snumber]},"$set"=>{'last_visit'=>utctime})
    result = {"result"=>"success", "message"=>"updated "+utctime.to_s+" "+@player["nickname"], "player"=>@player["nickname"],
               "currImage"=>currImage, "image_time_stamp"=>@player["image_time_stamp"], 'nextPull'=>pullInterval, 'stretch'=>stretch}
    @client.close
    render :json=>result, :callback => params[:callback]
  end
  
  
  def player 
  end
  
  def currentImage       
    if(params[:snumber]==nil)
      result = {"result"=>"error", "message"=>"no serial number!"}
      render json: result
      return
    end
    
    if(params[:regToken]==nil)
      result = {"result"=>"error", "message"=>"no reg token!"}
      render json: result
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    if @db['clients'].find({'account'=>params[:snumber], "reg_token"=>params[:regToken]}).count == 0
      result = {"result"=>"error", "message"=>"Player cannot be identified"}
      @client.close
      render json: result
      return
    end
    
    @player = @db['clients'].find({'account'=>params[:snumber]}).to_a[0]
    currImageIndex = 790
    if @player["curr_image"].to_i != -1
      currImageIndex = @player["curr_image"].to_i
    end
    
    imageSet = @db['images'].find({'id'=>currImageIndex.to_i})
    if imageSet.count > 0
      currImage = imageSet.to_a[0]
    end
    
    utctime = utcMillis()
    image_time_stamp = @player["image_time_stamp"]
    if image_time_stamp == nil
      image_time_stamp = utctime
    end
    @db['clients'].update({'account'=>params[:snumber]},"$set"=>{'last_visit'=>utctime})
    result = {"imageURL"=>currImage["url"],"title"=>currImage["Title"],"caption"=>currImage["Artist"],
      "timeStamp"=>image_time_stamp}
    @client.close
    render json: JSON.pretty_generate(result)     
  end
  
  
end  
