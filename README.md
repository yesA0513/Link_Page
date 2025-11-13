# Link Hub 🔗

<img width="1437" height="821" src="https://github.com/user-attachments/assets/c12d83f1-5c98-417f-9652-932fc1587636" />

필요한 링크를 연결하여 어디서든지 접근할 수 있습니다.

# 스크린샷 📷
<p algin="center">
  <img src="https://github.com/user-attachments/assets/0f895ac5-5763-42d6-ad5b-f1539f7a90e3" width="49%">
  <img src="https://github.com/user-attachments/assets/3bcb6012-1de1-4383-bd5d-835c09bacb54" width="49%">
</p>

> Dark / Light Mod

# 빌드 
이 템플릿을 사용하고 싶은 경우엔 Fork를 통해 Repository를 복제하세요.

FireBase를 이용하여 데이터베이스를 구축하였습니다. 기본적인 코딩은 Firebase를 바탕으로 이루어져 있습니다.

기능을 이용하기 위해선 Firebase의 Firestore Database가 먼저 필요합니다. 커스텀을 시작하기 전에 먼저 Firebase 의 데이터 베이스를 만들어 주세요.

## Vercel을 이용할 경우

Vercel을 이용하여 서비스 할 경우, Enviroment를 다음과 같이 설정해주어야 합니다.

Firebase config의 값을 Setting - Enviroments Varaibles 에 추가해주세요.

|Key|Value|
|---------|---------|
|FB_API_KEY|apiKey|
|FB_AUTH_DOMAIN|authDomain|
|FB_PROJECT_ID|projectId|
|FB_STORAGE_BUCKET|storageBucket|
|FB_MESSAGING_SENDER_ID|messagingSenderId|
|FB_APP_ID|appId|

그 다음 Build and Deployment 에서
Framework Settings의 Build Command와 Output Directory 를 다음과 같이 설정해주세요.

Build Command:

```
echo "const firebaseConfig = { apiKey: '${FB_API_KEY}', authDomain: '${FB_AUTH_DOMAIN}', projectId: '${FB_PROJECT_ID}', storageBucket: '${FB_STORAGE_BUCKET}', messagingSenderId: '${FB_MESSAGING_SENDER_ID}', appId: '${FB_APP_ID}' };" > firebase.js
```

Output Directory: 

```
.
```

> . 은 root 저장소를 의미합니다.
