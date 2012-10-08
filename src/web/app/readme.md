
## Libraries / Stack

Our HTTP stack currently consists of the following components, given here in the order that they handle incoming requests:

1. nginx
2. connect.js
3. express.js

Nginx provides basic load balancing across a pool of connect/express http servers and also directly handles the serving of many requests for static assets.

Connect/express provide a cluster of dyanmic http servers: express provides fairly abstract routing, views, and some basic controller like notions, while connect provides middleware for pre- or post-processing HTTP requests, appending cookie/session information, parsing headers, etc.

## Setup

To install any libraries or dependencies, run:

    $ cd lede/src/web/app
    $ npm install

In order to serve static assets (as opposed to pure API endpoints), nginx will also be required. On Fedora:

    $ sudo yum install nginx

And Ubuntu:

    $ sudo apt-get install nginx

Once nginx is installed, it must be configured to proxy dynamic requests to express servers (typically running on :3000 on dev environments) and to serve static assets itself out of the src/web/app/public directory of your working copy.

To get started, edit /etc/nginx/nginx.conf

    $ sudo vim /etc/nginx/nginx.conf

You need to add an upstream declaration to your http block:

    upstream express {
        server 127.0.0.1:3000;
    }

Also in your http block, add (or replace) your server declaration with something like the following.

    server {    
        listen 8080;            
        server_name localhost;  

        root /home/YOUR_USER_NAME/Code/lede/src/web/app/public/;

        location ~* \.(jpg|jpeg|gif|png|ico|css|bmp|js)$ {
          root /home/YOUR_USER_NAME/Code/lede/src/web/app/public/;
        }                       

        location / {            
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header Host $http_host;
          proxy_redirect off;

          if (-f $request_filename/index.html) {
            rewrite (.*) $1/index.html break;
          }
          if (-f $request_filename.html) {
            rewrite (.*) $1.html break;
          }
          if (!-f $request_filename) {
            proxy_pass http://express;
            break;
          }
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
          root html;
        }
    }

Remember to be sure to verify that the paths in the file are updated to match your system paths.

## Running

### Running the Server Locally for Development or Testing

To start the dynamic web server for local development or testing, tell node to run the app.js express entry point:

    $ node app.js

This will start and express/connect HTTP server on port 3000.

Since we serve static assets (stylesheets, javascripts, images, etc) through nginx, ensure you have nginx running as well:

    $ sudo service nginx start

This will start nginx on (assuming the configuration from the previous section was used) port 8080.

When testing, always navigate to :8080 (as opposed to directly navigating to :3000), and let nginx decide which requests to handle itself and which to pass along to express on :3000.

### Clustered / Production

To run under a balanced cluster, see server/readme.md
