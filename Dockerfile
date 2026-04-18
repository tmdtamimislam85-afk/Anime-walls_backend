# Node.js এর স্টেবল ভার্সন ব্যবহার করা হচ্ছে
FROM node:20-bullseye

# লাইব্রেরি আপডেট করা
RUN apt-get update && apt-get install -y python3 make g++

# অ্যাপ ডিরেক্টরি
WORKDIR /app

# ডিপেন্ডেন্সি কপি ও ইন্সটল
COPY package*.json ./
RUN npm install

# সোর্স কোড কপি
COPY . .

# SQLite ডাটাবেস ফাইলগুলো কপি হওয়া নিশ্চিত করা
COPY anime_walls.db ./
COPY anime_walls_live.db ./

# পোর্ট এক্সপোজ করা
EXPOSE 5000

# সার্ভার স্টার্ট
CMD ["node", "index.js"]
