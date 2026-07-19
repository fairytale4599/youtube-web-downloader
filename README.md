# Youtube Video Downloader

A small web application that downloads videos from youtube with search option

Made on React + Vite, for backend Express.js and ytdlp-nodejs.

## How to use it

1. You need to add your Youtube Data API key.

It's totally free, all you have to do is open [Google Cloud Console](https://console.cloud.google.com/), then create your project, open [APIs & Services](https://console.cloud.google.com/apis/dashboard) and enable your Youtube Data API v3. In credentials will be your key, copy it and post it in the modal form.

2. Start the project

Use Vite's `npm run dev` to run frontend part and `npx tsx server.ts` in the folder `src/server/youtube` for the backend (might just add bash startups later).

3. Search for the video

You can manually search for the video in the search query or paste the link to it and download it.
Your downloaded videos will be stored in `src/server/youtube/tmp`.

Updates soon!

## Screenshots
<img width="1077" height="774" alt="image" src="https://github.com/user-attachments/assets/6a44e19c-c60e-456d-b571-e3ab23587b45" />
<img width="819" height="780" alt="image" src="https://github.com/user-attachments/assets/863d65a9-50ed-46d7-b9c4-cf42c03d587d" />
