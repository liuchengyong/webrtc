ssh -i ~/.ssh/id_rsa root@47.105.227.92 "   
    cd /project/webrtc
    git checkout master
    git fetch origin master
    git reset --hard origin/master
    git pull
    
    echo -e '\n--------------最近两次的提交记录：--------------'
    git log -2 | cat
    echo -e '----------------------------\n'
    
    pm2 restart 1v1
"