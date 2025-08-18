FROM node:22

#Working directory
WORKDIR /


#copy package.json
COPY package*.json ./

#Install dependencies
RUN npm install

#copy rest of app except node modules
COPY  . . 



EXPOSE 3001


CMD ["node","index"]

