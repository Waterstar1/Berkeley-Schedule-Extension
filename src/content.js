
addInfo();
function addInfo() {
    getInstructors();
}

/* Finds instructor names from Cal Schedule Website */
function getInstructors() {
    var elements = document.getElementsByClassName("ls-instructors fspmedium");
    for (let item of elements) {
        var instructors = $(item).text().trim().replace(new RegExp("\\s+", "g"), " ").split(",");    
        for(let name of instructors) {
            name = name.trim().split(" ");
            var firstName = name[0];
            var lastName = name[name.length - 1];
            $(item).append("<div></div>");
            children = $(item).children("div");
            additional = children[children.length - 1];

            lookUpInstructor(firstName, lastName, additional);
        }
    }
}

/* Retrieves instructor data from RateMyProfessor API */
function lookUpInstructor(firstName, lastName, element) {
    const rmpAPI = "https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&json.wrf=noCB&callback=noCB&q="+ firstName + "+" + lastName +"&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+teacherfullname_autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=score+desc&defType=edismax&siteName=rmp&rows=20&group=off&group.field=content_type_s&group.limit=20&fq=schoolid_s%3A1072"
    const request = $.ajax({url: rmpAPI, success: function(data) {
        console.log("Capture data success!")
    }}).done(function (response) {
        console.log(response);    
        var data = response.toString();
        data = data.substring(5, data.length - 1);     

        var dataArr = JSON.parse(data).response.docs[0];
        if (dataArr !== undefined) {
            var OR = (dataArr.hasOwnProperty("averageratingscore_rf")) ? dataArr.averageratingscore_rf : "--";
            var LoD = (dataArr.hasOwnProperty("averageeasyscore_rf")) ? dataArr.averageeasyscore_rf : "--";
            var NoR = (dataArr.hasOwnProperty("total_number_of_ratings_i")) ? dataArr.total_number_of_ratings_i : "--";
        } else {
            var OR = "--";
            var LoD = "--";
            var NoR = "--";
        }
        editPage(OR, LoD, NoR, element);

    })
        .fail(function (Response) {
    });;
}

/* Adds RateMyProfessor data to Berkeley schedule website */
function editPage(OR, LoD, NoR, additional) {
    $(additional).append("<span class=ls-label>&#9733</span>");
    $(additional).append("<span>" + OR + "</span>");
    $(additional).append("<span class=ls-label>&nbsp LoD:</span>");
    $(additional).append("<span>" + LoD + "</span>");
    $(additional).append("<span class=ls-label>&nbsp #</span>");
    $(additional).append("<span>" + NoR + "</span>");
}
