#-- Get a rackspace VM image
#-- Author: Jonathan Hayden
#-- Project: FeedReader
#-- Company: readtheinter.net
#!/bin/sh
RS_USER="jhayden211"
RS_API_KEY="498278b2c12744af7c1d986101d371a1"
RS_API_URL="https://auth.api.rackspacecloud.com/v1.0"
LOCAL_IMAGE_PATH="/tmp/rs_local_image.tar.gz";

#--Attempt to connect to the Rackspace API 
curl -s -D - -H "X-Auth-User: ${RS_USER}" -H "X-Auth-Key: ${RS_API_KEY}" ${RS_API_URL} > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "INFO:  Successfully connected to the Rackspace API";
else
  echo "ERROR: Failed to connect to the Rackspace API";
  exit 1;
fi

#-- Retrieve the http header returned by the Rackspace API
RS_RESPONSE=`curl -s -D - -H "X-Auth-User: ${RS_USER}" -H "X-Auth-Key: ${RS_API_KEY}" ${RS_API_URL}`;

#-- Retrieve the X-Storage-Url value from the http header returned by the Rackspace API
RS_STOR_URL=`echo "$RS_RESPONSE" | awk '/X-Storage-Url/ {print $2}' | sed -e 's/\r//g'`;

#-- Retrieve the X-Storage-Token value from the http header returned by the Rackspace API
RS_STOR_TOKEN=`echo "$RS_RESPONSE" | awk '/X-Storage-Token/ {print $2}' | sed -e 's/\r//g'`;

#-- Retrieve the image list
RS_IMAGE_LIST=`curl -s -H "X-Storage-Token: ${RS_STOR_TOKEN}" ${RS_STOR_URL}/cloudservers | awk '/tar.gz/ {print} '| sed -e 's/\r/ /g'`;

#-- Download the image chucks and build a full image
for i in "$RS_IMAGE_LIST"; do 
  echo "INFO:  Retreiving image: $i";

  #-- Remove stale copy of the local image
  if [ -f "$LOCAL_IMAGE_PATH" ]; then
    rm "$LOCAL_IMAGE_PATH";
  fi

  #-- Download and build a single image out of the 5GB chunks
  curl -H "X-Storage-Token: ${RS_STOR_TOKEN}" ${RS_STOR_URL}/cloudservers/$i >> "$LOCAL_IMAGE_PATH";

done;

#TODO build an F15 VM and host it
#     Download the VM, and mount the virtual disk file
#     Untar this into the virtual disk
#     Set up chroot, and point it to the untar
#     Black Magic
#     Profit?
