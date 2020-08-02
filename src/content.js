chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(message, sender, sendResponse){
    if (message.text == "send it, dude") {
        getCatalog();
    }
}

function getCatalog() {
    btAPI = "https://www.berkeleytime.com/api/grades/grades_json/?form=long";
    const request = $.ajax({url: btAPI}).done(function (response) {
        
        var catalog = response.courses;
        toCourseIDS = new Map();
        for(key in catalog) {
            value = catalog[key];
            toCourseIDS.set(value.title.toLowerCase().replace(new RegExp("\\s+", "g"), ""), value.id);
        }
        addInfo();
    })
        .fail(function (Response) {
    });;
}

function addInfo() {
    getInstructors();
}

/* Finds instructor names from Cal Schedule Website */
function getInstructors() {

    var elements = document.getElementsByClassName("ls-instructors fspmedium");

    for (let item of elements) {

        // Finds course title for respectively respective professors
        var courseTitle = item.parentNode.querySelector('.ls-course-title').innerHTML;
        var simpleCourseTitle = courseTitle.toLowerCase().replace(new RegExp("\\s+", "g"), "")

        // Parses instructor description into multiple professors if possible 
        var instructors = $(item).text().trim().replace(new RegExp("\\s+", "g"), " ").split(",");
        
        for(let name of instructors) {
            
            // Parses professor name into first and last. 
            name = name.trim().split(" ");
            var firstName = name[0];
            var lastName = name[name.length - 1];

            // New section for ratings    
            $(item).append("<div></div>");
            var children = $(item).children("div");
            var additional = children[children.length - 1];

            lookUpInstructor(firstName, lastName, additional, simpleCourseTitle);
        }
    }
}

/* Retrieves instructor data from RateMyProfessor API */
function lookUpInstructor(firstName, lastName, element, simpleCourseTitle) {
    const rmpAPI = "https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&json.wrf=noCB&callback=noCB&q="+ firstName + "+" + lastName +"&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+teacherfullname_autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=score+desc&defType=edismax&siteName=rmp&rows=20&group=off&group.field=content_type_s&group.limit=20&fq=schoolid_s%3A1072"
    const request = $.ajax({url: rmpAPI}).done(function (response) {  

        // Parse json response from Rate My Professor into particular values
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

        editPage(OR, LoD, NoR, element, simpleCourseTitle);
    })
        .fail(function (Response) {
    });;
}

/* Adds RateMyProfessor data to Berkeley schedule website */
function editPage(OR, LoD, NoR, additional, simpleCourseTitle) {

    // Rate My Professor additions
    $(additional).append("<span class=ls-label>&#9733</span>");
    $(additional).append("<span>" + OR + "</span>");
    $(additional).append("<span class=ls-label>&nbsp LoD:</span>");
    $(additional).append("<span>" + LoD + "</span>");
    $(additional).append("<span class=ls-label>&nbsp #</span>");
    $(additional).append("<span>" + NoR + "</span>");

    //Add grade distribution button
    var button = document.createElement("a");
    button.className = "grade-button";
    button.innerText = "Button!"

    additional.appendChild(button);

    requestGrades(simpleCourseTitle)

}

function requestGrades() {
    btAPI = "https://www.berkeleytime.com/api/grades/grades_json/?form=long";
}
 





function popUp() {
    var elements = document.getElementsByClassName("ls-course-title fmpbook");
    $(elements[0]).append("<div id='popup' style='display: none'>description text here</div>");
    
}
