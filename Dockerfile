FROM node:12.18-alpine as buildProd
ENV JQ_VERSION=1.6
RUN wget --no-check-certificate https://github.com/stedolan/jq/releases/download/jq-${JQ_VERSION}/jq-linux64 -O /tmp/jq-linux64
RUN cp /tmp/jq-linux64 /usr/bin/jq
RUN chmod +x /usr/bin/jq
WORKDIR /app
COPY package-lock.json package.json ./ 
RUN npm ci
COPY . .

RUN jq 'to_entries | map_values({ (.key) : ("$" + .key) }) | reduce .[] as $item ({}; . + $item)' ./src/config.json > ./src/config.tmp.json && mv ./src/config.tmp.json ./src/config.json
RUN npm run build

FROM nginx:1.19.7-alpine
# # Add bash
RUN apk add --no-cache bash

# React
ENV JSFOLDER=/usr/share/nginx/html/static/js/main.*.js
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./start-nginx.sh /usr/bin/start-nginx.sh
RUN chmod +x /usr/bin/start-nginx.sh
WORKDIR /usr/share/nginx/html

COPY --from=buildProd /app/build .

ENTRYPOINT [ "start-nginx.sh" ]
