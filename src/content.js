
chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse) {
    if (message.text == "send") {
        console.log("mochi");
        addInfo();
    }
}

function addReviews() {
    var list = document.querySelectorAll('[aria-label="Instructors"]');
    console.log(list[0]);

    var changes = document.getElementsByClassName("ls-instructors fspmedium")
    var additional =  changes[0];
    $($(additional).children("span")).wrapAll("<div ></div>");
    $(additional).append("<span class=ls-label>&#9733</span>");
    var wf = 4.5
    $(additional).append("<span>" + wf + "</span>");
    $(additional).append("<span class=ls-label>&nbsp LoD:</span>");
    $(additional).append("<span>3</span>");
    $(additional).append("<span class=ls-label>&nbsp #</span>");
    $(additional).append("<span>56</span>");
}

function addInfo() {
    var elements = document.getElementsByClassName("ls-instructors fspmedium");
    for (let item of elements) {
        var instructors = $(item).text().trim().replace(new RegExp("\\s+", "g"), " ").split(",");    
        for(let name of instructors) {
            name = name.trim().split(" ");
            var firstName = name[0];
            var lastName = name[name.length - 1];
            var review = lookUpInstructor(firstName, lastName);
            editPage(review, item)
        }
    }
}

function lookUpInstructor(firstName, lastName) {
    const rmpAPI = "https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&json.wrf=noCB&callback=noCB&q="+ firstName + "+" + lastName +"&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+teacherfullname_autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=score+desc&defType=edismax&siteName=rmp&rows=20&group=off&group.field=content_type_s&group.limit=20&fq=schoolid_s%3A1072"
    const request = $.ajax({url: rmpAPI, success: function(data) {
        console.log("Capture data success!")
    }}).done(function (response) {
        console.log(response);    
        var data = response.toString();
        data = data.substring(5, data.length - 1);     

        var dataArr = JSON.parse(data).response.docs[0];
        console.log(dataArr);
        if (dataArr !== undefined) {
            var OR = (Array.from(dataArr).some(item => _.isEqual(item, "averageratingscore_rf"))) ? dataArr.averageratingscore_rf : "--";
            var LoD = (Array.from(dataArr).some(item => _.isEqual(item, "averageeasyscore_rf"))) ? dataArr.averageeasyscore_rf : "--";
            var NoR = (Array.from(dataArr).some(item => _.isEqual(item, "total_number_of_ratings_i"))) ? dataArr.total_number_of_ratings_i : "--";
        } else {
            var OR = "--";
            var LoD = "--";
            var NoR = "--";
        }

        return [OR, LoD, NoR];
        
    })
        .fail(function (Response) {
          //do something when any error occurs.
    });;
}

function editPage(review, item) {
    var additional = item;
    var hi = "-";
    $($(additional).children("span")).wrapAll("<div ></div>");
    $(additional).append("<span class=ls-label>&#9733</span>");
    $(additional).append("<span>" + review[0] + "</span>");
    $(additional).append("<span class=ls-label>&nbsp LoD:</span>");
    $(additional).append("<span>" + hi + "</span>");
    $(additional).append("<span class=ls-label>&nbsp #</span>");
    $(additional).append("<span>" + hi + "</span>");
}


function logWord() {
    let selectedText = window.getSelection().toString();
    console.log(selectedText);

    var firstName = "josh"
    var lastName = "hug"
    

    const rmpAPI = "https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&json.wrf=noCB&callback=noCB&q="+ firstName + "+" + lastName +"&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+teacherfullname_autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=score+desc&defType=edismax&siteName=rmp&rows=20&group=off&group.field=content_type_s&group.limit=20&fq=schoolid_s%3A1072"
    const request = $.ajax({url: rmpAPI, success: function(data) {
        console.log("Capture data success!")
    }}).done(function (response) {
        console.log(response);    
        var data = response.toString();
        data = data.substring(5, data.length - 1);     

        var dataArr = JSON.parse(data).response.docs[0];
        
        if (response !== undefined) {
            var OR = dataArr.averageratingscore_rf;
            var LoD = dataArr.averageeasyscore_rf;
            var NoR = dataArr.total_number_of_ratings_i;

            console.log(OR, LoD, NoR);
        }

        
    })
        .fail(function (Response) {
          //do something when any error occurs.
    });;
}




