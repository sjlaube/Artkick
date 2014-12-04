 window.msToTime=function(s)
    {
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        s = (s - mins) / 60;
        var hrs = s % 24;
        s = (s - hrs) / 24;
        var days = s;
        //console.log(days+':'+hrs + ':' + mins + ':' + secs + '.' + ms);
        if (days > 0)
            return (days + " day ago");
        else if (hrs > 0)
            return (hrs + " hr ago");
        else if (mins > 0)
            return (mins + " min ago");
        else
            return ("Just now");
    }