class Client1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'json'
  
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
    
    
  def getGettyUrl(userEmail,imageObj)
    if userEmail == nil
      return imageObj['url']
    end
    
    userSet = @@userDb['users'].find({'email'=>userEmail})
    if userSet.count == 0
      return imageObj['url']
    end   
    
    user = userSet.to_a[0] 
    
    userSubs = ''


      subs = []    
      if user['test_subs']!=nil and user['test_subs'].length > 0
         subs = [user['test_subs'][0]]
      end
      
      if user['ios_subs']!=nil
        user['ios_subs'].each do |prodName|
          if prodName!=nil and user['ios_subs_detail'][prodName] > utcMillis
            if prodName == 'Getty_All3'
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
       return imageObj['artkick_url']
    end
      
    if (not permitted) and imageObj['waterMark']!=nil
       return imageObj['waterMark']
    end 
      
    return imageObj['url'] 
    
    
  end  
    

  def isSubs(userEmail)
    if userEmail == nil
      return false
    end
    
    userSet = @@userDb['users'].find({'email'=>userEmail})
    if userSet.count == 0
      return false
    end
    
    user = userSet.to_a[0]
    
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
    
    return subs
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
    
  def player 
  end
  
   
  def nextImage       
    if(params[:deviceId]==nil)
      result = {"Status"=>"Failure", "message"=>"no device id!"}
      render json: result
      return
    end
    
    if(params[:deviceMaker]==nil)
      result = {"Status"=>"Failure", "message"=>"no deviceMaker!"}
      render json: result
      return
    end
    
    
    
    
    
    defaultObj = @@contentDb['defaults'].find().to_a[0]
    
    if @@userDb['clients'].find({'account'=>params[:deviceMaker]+params[:deviceId]}).count == 0
      result = {"Status"=>"Failure", "StatusCode"=>101, "message"=>"Player doesn't exist!"}
      render json: result 
      return
    end
    
    
    utctime = utcMillis() #current utc millis
    
    
    @player = @@userDb['clients'].find({'account'=>params[:deviceMaker]+params[:deviceId]}).to_a[0]
    
    
    pullInterval = 500
  
        currListObj = nil
         userObj = nil

        listSet = getListSet(@player["curr_list"])
        if listSet.count > 0
           currListObj = listSet.to_a[0]
        end

         
         if currListObj == nil
           currListObj = getListSet(defaultObj['viewlist']).to_a[0]
         end
         
         images = currListObj["images"]
         if @player["curr_list_images"]!=nil and @player["curr_list_images"].length>0
           images = @player["curr_list_images"]
         end
          

          
          
    if params[:next].to_i == 1
       currIndex = (@player["curr_index"].to_i + images.length + 1)%images.length
          emptyCount = 0
          while true
           currImageIndex = images[currIndex]
           imageSet = getImageSet(currImageIndex)
           if imageSet.count > 0
              currImage = imageSet.to_a[0]
              break
           end
           
           emptyCount += 1
           if emptyCount == 1
             currListObj = getListSet(defaultObj['viewlist']).to_a[0]
             currImage = getImageSet(defaultObj['image']).to_a[0]
             images = currListObj['images']
             break
           end
           currIndex = (currIndex+1)%images.length
         end
    else
       currIndex = (@player["curr_index"].to_i + images.length - 1)%images.length
        emptyCount = 0
        while true
           currImageIndex = images[currIndex]
           imageSet = getImageSet(currImageIndex)
           if imageSet.count > 0
              currImage = imageSet.to_a[0]
              break
           end           
           
           emptyCount += 1
           if emptyCount == 1
              currListObj = getListSet(defaultObj['viewlist']).to_a[0]
              currImage = getImageSet(defaultObj['image']).to_a[0]
              images = currListObj['images']              
              break
           end
           currIndex = (currIndex+images.length-1)%images.length
            
         end
    end
    
             
    

         
    image_time_stamp = @player["image_time_stamp"]
    if image_time_stamp == nil
       image_time_stamp = utctime
    end
    
       stretch = "false"
    if @player["stretch"] != nil
       stretch = @player["stretch"].to_s
    end
         
         
         
    if @player["curr_user"] != nil
       @@userDb['users'].update({"email"=>@player["curr_user"]},"$set"=>{"curr_image"=>currImage["id"],"curr_list"=>currListObj['id'],"curr_list_images"=>images})
    end         
         
         
    @@userDb['clients'].update({'account'=>params[:deviceMaker]+params[:deviceId]},"$set"=>{'last_visit'=>utctime,
    'curr_index'=>currIndex,'curr_image'=>currImage["id"], 'curr_list'=>currListObj['id'], 'curr_list_images'=>images, 'image_time_stamp'=>utcMillis()})
  
                    
    result = {"Status"=>"Success","StatusCode"=>100, "imageURL"=>currImage["url"].sub('https://','http://'),"title"=>currImage["Title"],
     "timeStamp"=>image_time_stamp, "stretch"=>stretch, "nextPull"=>500}

    if currImage["Artist Last N"]==nil
        result["caption"]=""
    else
        result["caption"]=currImage["Artist First N"]+' '+currImage["Artist Last N"]
    end
    
    if currImage['id'].to_s.include? 'getty'
      @@userDb['gettyImages'].update({'id'=>currImage['id']},{'$set'=>{'last_visit'=>utcMillis()}})
      result['imageURL'] = getGettyUrl(@player["curr_user"], currImage).sub('https://','http://')
      result['caption'] = URI.escape(currImage['Copyright'])
    end  
    
        render json: JSON.pretty_generate(result)   
  end 
  
  
  
  
  
  def currentImage       
    if(params[:deviceId]==nil)
      result = {"Status"=>"Failure", "message"=>"no device id!"}
      render json: result
      return
    end
    
    if(params[:deviceMaker]==nil)
      result = {"Status"=>"Failure", "message"=>"no deviceMaker!"}
      render json: result
      return
    end
    
    
    #if(params[:regToken]==nil)
    #  result = {"Status"=>"Failure", "message"=>"no reg token!"}
    #  render json: result
    #  return
    #end
    
    
    
    
    
    
    defaultObj = @@contentDb['defaults'].find().to_a[0]
    
    if @@userDb['clients'].find({'account'=>params[:deviceMaker]+params[:deviceId]}).count == 0
      result = {"Status"=>"Failure", "StatusCode"=>101, "message"=>"Player doesn't exist!"}
      render json: result
      return
    end
    
    
    
        
    @player = @@userDb['clients'].find({'account'=>params[:deviceMaker]+params[:deviceId]}).to_a[0]
    utctime = utcMillis()
    
    image_time_stamp = @player["image_time_stamp"]
    if image_time_stamp == nil
      image_time_stamp = utctime
    end
  
      
    if utctime - image_time_stamp > 40*60000
      pullInterval = 18000
    elsif utctime - image_time_stamp > 20*60000
      pullInterval = 8000
    elsif utctime - image_time_stamp > 10*60000
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
         
          currListObj = nil
         userObj = nil

           listSet = getListSet(@player["curr_list"])
           if listSet.count > 0
              currListObj = listSet.to_a[0]
           end

         
         if currListObj == nil
           currListObj = getListSet(defaultObj['viewlist']).to_a[0]
         end
         
         images = currListObj["images"]
         if @player["curr_list_images"]!=nil and @player["curr_list_images"].length>0 
           images = @player["curr_list_images"]
         end
         
         

         
         
         currIndex = (@player["curr_index"].to_i + 1)%images.length
         
         emptyCount = 0
         while true
           currImageIndex = images[currIndex]
           imageSet = getImageSet(currImageIndex)
           if imageSet.count > 0
              currImage = imageSet.to_a[0]
              break
           else
             emptyCount += 1
             if emptyCount == 1
               currImage = getImageSet(defaultObj['image']).to_a[0]
               currListObj = getListSet(defaultObj['viewlist']).to_a[0]
               images = currListObj['images']
               break
             end
           end
           
           currIndex = (currIndex+1)%images.length
            
         end
         

    
         stretch = "false"
         if @player["stretch"] != nil
           stretch = @player["stretch"].to_s
         end
         
         @@userDb['clients'].update({'account'=>params[:deviceMaker]+params[:deviceId]},"$set"=>{'last_visit'=>utctime,
           'curr_index'=>currIndex, 'lastMorning'=>lastMorning,  'curr_image'=>currImage["id"], 'curr_list'=>currListObj['id'], 'curr_list_images'=>images})
  
         if @player["auto_user"] != nil
           @@userDb['users'].update({"email"=>@player["auto_user"]},"$set"=>{"curr_image"=>currImage["id"],"curr_list"=>currListObj['id'],"curr_list_images"=>images})
         end
                    
         result = {"Status"=>"Success","StatusCode"=>100, "imageURL"=>currImage["url"].sub('https://','http://'),"title"=>currImage["Title"],
            "timeStamp"=>image_time_stamp, "stretch"=>stretch, "nextPull"=>pullInterval, "autoInterval"=>@player["autoInterval"].to_i}
            
         if currImage["Artist Last N"]==nil
            result["caption"]=""
         else
            result["caption"]=currImage["Artist First N"]+' '+currImage["Artist Last N"]
         end
         
    
    
    if currImage['id'].to_s.include? 'getty'
      @@userDb['gettyImages'].update({'id'=>currImage['id']},{'$set'=>{'last_visit'=>utcMillis()}})
      result['imageURL'] = getGettyUrl(@player["curr_user"], currImage).sub('https://','http://')
      result['caption'] = URI.escape(currImage['Copyright'])
    end          
         
         
         render json: JSON.pretty_generate(result)   
         
         return
         
      end
      
    end
    
    
         
    
    if @player["autoInterval"].to_i > 0
      
      targetTime = @player["lastAutoAssign"].to_i+@player["autoInterval"].to_i
      
      if (@player["lastAutoAssign"].to_i == -1) or (utctime > targetTime) or (targetTime >= utctime and targetTime <= (utctime+pullInterval))
        
         lastAutoAssign = utctime
         
         currListObj = nil
         userObj = nil
         
           listSet = getListSet(@player["curr_list"])
           if listSet.count > 0
              currListObj = listSet.to_a[0]
           end         
         
         
         if currListObj == nil
           currListObj = getListSet(defaultObj['viewlist']).to_a[0]
         end
         
         images = currListObj["images"]
         if @player["curr_list_images"]!=nil and @player["curr_list_images"].length>0
           images = @player["curr_list_images"]
         end
         

                  
         currIndex = (@player["curr_index"].to_i + 1)%images.length
         emptyCount = 0
         while true
            currImageIndex = images[currIndex]
                      
             imageSet = getImageSet(currImageIndex)
             if imageSet.count > 0
                currImage = imageSet.to_a[0]
                break
             else
               emptyCount += 1
               if emptyCount == 1
                 currListObj = getListSet(defaultObj['viewlist']).to_a[0]
                 currImage = getImageSet(defaultObj['image']).to_a[0]
                 images = currListObj['images']
                 break
               end
             end           
           
           
           currIndex = (currIndex+1)%images.length
            
         end
         

    
         stretch = "false"
         if @player["stretch"] != nil
           stretch = @player["stretch"].to_s
         end
         
         @@userDb['clients'].update({'account'=>params[:deviceMaker]+params[:deviceId]},"$set"=>{'last_visit'=>utctime,
           'curr_index'=>currIndex, 'lastAutoAssign'=>lastAutoAssign, 'curr_image'=>currImage["id"], 'curr_list'=>currListObj['id'], 'curr_list_images'=>images})
  
         if @player["auto_user"] != nil
           @@userDb['users'].update({"email"=>@player["auto_user"]},"$set"=>{"curr_image"=>currImage["id"],"curr_list"=>currListObj['id'],"curr_list_images"=>images})
         end
                    
         result = {"Status"=>"Success","StatusCode"=>100, "imageURL"=>currImage["url"].sub('https://','http://'),"title"=>currImage["Title"],
            "timeStamp"=>image_time_stamp, "stretch"=>stretch, "nextPull"=>pullInterval, "autoInterval"=>@player["autoInterval"].to_i}
            
         if currImage["Artist Last N"]==nil
            result["caption"]=""
         else
            result["caption"]=currImage["Artist First N"]+' '+currImage["Artist Last N"]
         end
         
    if currImage['id'].to_s.include? 'getty'
      @@userDb['gettyImages'].update({'id'=>currImage['id']},{'$set'=>{'last_visit'=>utcMillis()}})
      result['imageURL'] = getGettyUrl(@player["curr_user"], currImage).sub('https://','http://')
      result['caption'] = URI.escape(currImage['Copyright'])
    end          
         
         
         
         render json: JSON.pretty_generate(result)   
         
         return
         
      end
      
      
    end
    
    
    
    
    
    
    
    
    
    
    currImageIndex = defaultObj["image"]
    if @player["curr_image"].to_s != '-1'
      currImageIndex = @player["curr_image"]
    end
        
       imageSet = getImageSet(currImageIndex)
       if imageSet.count > 0
         currImage = imageSet.to_a[0]
       end    
    
    if currImage == nil
      currImage = getImageSet(defaultObj["image"]).to_a[0]
    end
    
    

    
    stretch = "false"
    if @player["stretch"] != nil
      stretch = @player["stretch"].to_s
    end
    @@userDb['clients'].update({'account'=>params[:deviceMaker]+params[:deviceId]},"$set"=>{'last_visit'=>utctime})
    
    result = {"Status"=>"Success","StatusCode"=>100, "imageURL"=>currImage["url"].sub('https://','http://'),"title"=>currImage["Title"],
      "timeStamp"=>image_time_stamp, "stretch"=>stretch, "nextPull"=>pullInterval, "autoInterval"=>@player["autoInterval"].to_i}
      
    if @player["orientation"]!=nil
      result["orientation"] = @player["orientation"]
    end    
      
    if currImage["Artist Last N"]==nil
      result["caption"]=""
    else
      result["caption"]=currImage["Artist First N"]+' '+currImage["Artist Last N"]
    end

    
    if currImage['id'].to_s.include? 'getty'
      @@userDb['gettyImages'].update({'id'=>currImage['id']},{'$set'=>{'last_visit'=>utcMillis()}})      
      result['imageURL'] = getGettyUrl(@player["curr_user"], currImage).sub('https://','http://')
      result['caption'] = URI.escape(currImage['Copyright'])
    end   
    
    
    
    render json: JSON.pretty_generate(result)     
  end
  
  

  
end  
