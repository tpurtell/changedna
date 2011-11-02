

var CodeA = 'a'.charCodeAt(0); 
var CodeZ = 'z'.charCodeAt(0); 
function computeVerticalPosition(buckets, entry) {
    var word = entry.term;
    word = word.toLowerCase();
    while(word.length > 0 && (word.charCodeAt(0) < CodeA || word.charCodeAt(0) > CodeZ))
        word = word.substring(1);
    
    var min = 0;
    var max = 1;
    var lim = 1;
    entry.bucket = -1;
    for(var i = 0; i < word.length; ++i) {
        if(word.charCodeAt(i) < CodeA || word.charCodeAt(i) > CodeZ)
            continue;
        var slot = word.charCodeAt(i) - CodeA;
        var per_slot = (max - min) / (CodeZ - CodeA + 1);
        min += per_slot * slot;
        max =  min + per_slot;

        if(lim == 1) 
            entry.bucket = slot;
        //hack for experiementing with number of subdivisions
        if(--lim == 0)
            break;
    }
    while(lim > 0) {
        max = min + (max - min) / (CodeZ - CodeA + 1);
        --lim;
    }
    if(entry.bucket != -1) {
        buckets[entry.bucket].push(entry);
    } else {
        //alert(JSON.stringify(entry));
    }
    entry.miny = min;
    entry.maxy = max;
    entry.midy = (min + max) / 2;
    return entry;
}
function computeHorizontalPosition(bucket) {
    var x = 0;
    for(var i = 0; i < bucket.length; ++i) {
        var entry = bucket[i];
        entry.minx = x;
        entry.maxx = x + entry.score;
        entry.midx = (entry.minx + entry.maxx) / 2;
        x = entry.maxx;
    }
    return bucket;
}
var commit = 0;
var revisions = data.revisions;
var dates = data.dates;
var messages = data.messages;
var merged = data.merged;

var w = document.body.offsetWidth - 40,
    h = document.body.offsetHeight - 80 - 40,
    leftx = d3.scale.linear().domain([1, 0]).range([0, (w - 60) / 2]),
    lefty = d3.scale.linear().domain([0, 0.5]).range([0, h])
    rightx = d3.scale.linear().domain([0, 1]).range([w / 2 + 30, w]),
    righty = d3.scale.linear().domain([0.5, 1.0]).range([0, h])

var vis = d3.select("body")
  .append("svg:svg")
    .attr("width", w + 40)
    .attr("height", h + 80)
  .append("svg:g")
    .attr("transform", "translate(20,0)");


var rulesleft = vis.selectAll("g.ruleleft")
    .data(leftx.ticks(10))
  .enter().append("svg:g")
    .attr("class", "rule")
    .attr("transform", function(d) { return "translate(" + leftx(d) + ",0)"; });

rulesleft.append("svg:line")
    .attr("y1", h)
    .attr("y2", h + 6)
    .attr("stroke", "black");

rulesleft.append("svg:line")
    .attr("y1", 0)
    .attr("y2", h)
    .attr("stroke", "white")
    .attr("stroke-opacity", .15);


var rulesright = vis.selectAll("g.ruleright")
    .data(rightx.ticks(10))
  .enter().append("svg:g")
    .attr("class", "rule")
    .attr("transform", function(d) { return "translate(" + rightx(d) + ",0)"; });

rulesright.append("svg:line")
    .attr("y1", h)
    .attr("y2", h + 6)
    .attr("stroke", "black");

rulesright.append("svg:line")
    .attr("y1", 0)
    .attr("y2", h)
    .attr("stroke", "white")
    .attr("stroke-opacity", .3);
    
//rules.append("svg:text")
//    .attr("y", h + 9)
//    .attr("dy", ".71em")
//    .attr("text-anchor", "middle")
//    .text(x.tickFormat(10));

vis.append("svg:line")
    .attr("x1", leftx(0))
    .attr("x2", leftx(0))
    .attr("y1", 0)
    .attr("y2", h)
    .attr("stroke-width", 3)
    .attr("stroke", "black");

vis.append("svg:line")
    .attr("x1", rightx(0))
    .attr("x2", rightx(0))
    .attr("y1", 0)
    .attr("y2", h)
    .attr("stroke-width", 3)
    .attr("stroke", "black");
    
var letters = vis.selectAll("g.letters")
    .data(d3.range(0 + .5 / 26, 1 + .5 / 26, (1.0) / 26))
   .enter().append("svg:g")
    .attr("class", "rule");

letters.append("svg:text")
    .attr("x", leftx(0) + 10)
    .attr("x", function(d, i) {
        if(d > 0.499) {
            return rightx(0);
        } else {
            return leftx(0) + 10;
        }
    })
    .attr("y", function(d, i) {
        if(d > 0.499) {
            return righty(d);
        } else {
            return lefty(d);
        }
    })
    .attr("dx", -6)
    .attr("dy", ".35em")
    .attr("text-anchor", function(d, i) {
        if(d > 0.499) {
            return "end";
        } else {
            return "start";
        }
    })
    .text(function(d, i) { return String.fromCharCode(CodeA + i); });

var mintime = d3.min(revisions, function(c) { return dates[c]; });
var maxtime = d3.max(revisions, function(c) { return dates[c]; });

var timex = d3.scale.linear().domain([mintime, maxtime]).range([100,w - 52]),
    timey = d3.scale.linear().domain([-1, 1]).range([h + 20, h + 80]);

vis.append("svg:line")
    .attr("y1", timey(0))
    .attr("y2", timey(0))
    .attr("x1", timex(mintime))
    .attr("x2", timex(maxtime))
    .attr("stroke", "black");

var timeline = vis.selectAll("g.timeline")
    .data(revisions)
   .enter().append("svg:g")
    .attr("class", "timeline");

var timeline_opacity = (w / 10) / revisions.length;
timeline.append("svg:circle")
    .attr("cx", function(d,i) {
        return timex(dates[d]);
    })
    .attr("cy", timey(0))
    .attr("r", 8)
    .attr("opacity", timeline_opacity)
    .attr("stroke", "black")
    .on("mouseover", function() { 
        d3.select(this).attr("r", 14).attr("opacity", 1); 
    })
    .on("mouseout", function() { d3.select(this).attr("r", 8).attr("opacity", timeline_opacity); })
    .on("click", function(d, i) { pause(); activateRevision(i); });

function isRightPane(d) {
    return d.miny > 0.499;
}
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function(prefix) {
    return this.lastIndexOf(prefix, 0) === 0;
};
    
function makeGitHubURL(repo, commit) {
    repo = repo.split('//')[1];
    repo = repo.split('/').slice(1).join('/');
    if(repo.endsWith('.git'))
        repo = repo.substring(0, repo.length - 4);
    return "http://github.com/" + repo + "/commit/" + commit;
}

function activateRevision(i) {
    commit = i;
    var rev = data.revisions[i];
    $("#changeset").text(rev);
    $("#changeset").attr("href", makeGitHubURL(data.repo, rev));
    $("#message").text(messages[rev].replace(/\s+/g, ' '));

    vis.selectAll("g.timelineactive").remove();
    
    var timelineactive = vis.selectAll("g.timelineactive")
        .data([revisions[commit]])
       .enter().append("svg:g")
        .attr("class", "timelineactive");

    timelineactive.append("svg:circle")
        .attr("cx", function(d,i) {
            return timex(dates[d]);
        })
        .attr("cy", timey(0))
        .attr("r", 8)
        .attr("fill", "red");

    var max_score = 0;
    var words = data.words[rev];
    var items = [];
    for(var term in words) {
        items.push({term:term, count:words[term], score:words[term]});
    }
    items = items.filter(function(v) {
        return Math.abs(v.score) > 0 && v.term.length > 3;
    });
    var buckets = [];
    for(var i = 0; i < 26; ++i)
        buckets.push([]);
    items = items.map(function(d) { return computeVerticalPosition(buckets, d);});

    var bucket_tallies = [];
    bucket_tallies.length = 26;
    var max_bucket = 0;
    for(var i = 0; i < 26; ++i) {
        var bucket = buckets[i];
        bucket.sort(function(a,b) {
            var al = a.term.toLowerCase();
            var bl = b.term.toLowerCase();
            if(al < bl)
                return -1;
            if(al > bl)
                return 1;
            return 0;
        });
        bucket_tallies[i] = 0;
        for(var j = 0; j < bucket.length; ++j) {
            bucket_tallies[i] += Math.abs(bucket[j].count);
        }
        if(bucket_tallies[i] > max_bucket)
            max_bucket = bucket_tallies[i];
    }
    
    items = items.map(function(d) { d.score /= max_bucket; d.score = Math.abs(d.score); return d;});
    items = items.filter(function(d) { return d.bucket != -1; });

    //compute the stacking
    buckets = buckets.map(function(d) { return computeHorizontalPosition(d);});
    //flip the first half of the plot so the alphabetical sort order is always on the right
    for(var i = 0; i < 13; ++i) {
        buckets[i] = buckets[i].map(function(e) {
            e.minx = bucket_tallies[i] / max_bucket - e.minx;
            e.maxx = bucket_tallies[i] / max_bucket - e.maxx;
            e.midx = bucket_tallies[i] / max_bucket - e.midx;
        });        
    }

    vis.selectAll("g.bar").remove();

    var bars = vis.selectAll("g.bar")
        .data(items)
        .enter().append("svg:g")
        .attr("class", "bar");

    bars.append("svg:rect")
        .attr("fill", function(d) { return d.count < 0 ? "sandybrown" : "steelblue";})
        .attr("opacity", 0.3)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("x", function(d, i) { 
            if(isRightPane(d)) {
                return rightx(d.minx);
            } else {
                return leftx(d.minx); 
            }
        })
        .attr("y", function(d, i) { 
            if(isRightPane(d)) {
                return righty(d.miny);
            } else {
                return lefty(d.miny); 
            }
        })
        .attr("width", function(d, i) { 
            if(isRightPane(d)) {
                return Math.abs(rightx(d.maxx) - rightx(d.minx)); 
            } else {
                return Math.abs(leftx(d.maxx) - leftx(d.minx)); 
            }
        })
        .attr("height", function(d, i) { 
            if(isRightPane(d)) {
                return righty(d.maxy) - righty(d.miny); 
            } else {
                return lefty(d.maxy) - lefty(d.miny); 
            }
        })
        .on("mouseover", function(d) { 
            $("#word").text(d.term);
        })
        .on("mouseout", function() { 
            $("#word").text("Hover to see!");
        });

    bars.append("svg:text")
        .attr("x", function(d, i) { 
            if(isRightPane(d)) {
                return rightx(d.midx);
            } else {
                return leftx(d.midx); 
            }
        })
        .attr("y", function(d, i) { 
            if(isRightPane(d)) {
                return righty(d.midy);
            } else {
                return lefty(d.midy); 
            }
        })
       .attr("fill", "black")
       .text(function(d) {
            if(isRightPane(d)) {
                if(d.term.length * 8 > Math.abs(rightx(d.maxx) - rightx(d.minx)))
                    return "";
            } else {
                if(d.term.length * 8 > Math.abs(leftx(d.maxx) - leftx(d.minx)))
                    return "";
            }
            return d.term;
       })
       .attr("text-anchor", "middle");
}
var next_timeout;
var delay = 500;
function nextCommit() { 
    ++commit;
    commit = commit % revisions.length; 
    $("#cursor").attr("src", "active.png");
    activateRevision(commit);
    window.setTimeout(function() {
        $("#cursor").attr("src", "cursors.png");
    }, delay / 2);
    next_timeout = window.setTimeout(nextCommit, delay);    
}
function pause() {
    if(!next_timeout)
        return;
    $("#action").attr("src", "play.png");
    window.clearTimeout(next_timeout); 
    next_timeout = undefined; 
}
function play() {
    if(next_timeout)
        return;
    $("#action").attr("src", "pause.png");
    next_timeout = window.setTimeout(nextCommit, 0);    
}

next_timeout = setTimeout(nextCommit, 0);    
    $("#controls").css("top", h + 80);
    $("#cursors").css("top", h + 80);
    $("#cursors").css("left", w - 10);
    
    $("#action").click(function() { 
        if(next_timeout) {
            pause();
        } else {
            play();
        }
    });
    function updateDelay() {
        delay = parseInt($(this).attr("value"));
        if(delay == NaN) {
            delay = 500;
            $(this).text("500");
        }
        //in case you set it really big, and then small.. be nice and restart the timer
        if(next_timeout) {
            pause();
            play();
        }

    }
    $("#delay").change(updateDelay);
    $("#repo").text(data.repo);
    $("#changeset").click(pause);
    $("body").keydown(function(e) {
        switch (e.which) {
            case 32: //space
                if(next_timeout) pause();
                else play();
                break;
            case 40: //down
            case 39: //right
                pause();
                ++commit;
                commit = commit % revisions.length; 
                activateRevision(commit);
                break;
            case 38: //up
            case 37: //left
                pause();
                --commit;
                commit = (commit + revisions.length) % revisions.length; 
                activateRevision(commit);
                break;
        }
    });
