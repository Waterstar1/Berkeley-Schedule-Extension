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

        editPage(OR, LoD, NoR, element, firstName, lastName, simpleCourseTitle);
    })
        .fail(function (Response) {
    });;
}

/* Adds RateMyProfessor data to Berkeley schedule website */
function editPage(OR, LoD, NoR, additional, firstName, lastName, simpleCourseTitle) {

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
    button.innerText = "Grades!"

    additional.appendChild(button);
    button.setAttribute("courseTitle", simpleCourseTitle);

    // Parses instructor to match Berkeley Time API
    parsedName = lastName + ", " + firstName.substring(0, 1);
    button.setAttribute("instructor", parsedName.toUpperCase());

    // Handles popup events due to mouse hovering over the button
    button.addEventListener("mouseover", showInfo(button, additional, firstName, lastName));
    button.addEventListener("mouseout", removeInfo(button, additional));
}

function showInfo(button, parent, firstName, lastName) {
    return function() {
        var containerCheck = parent.querySelector(".grade-container");

        if (!containerCheck) {
            var courseID = toCourseIDS.get(button.getAttribute("courseTitle"));
            var gradeIDURL = "https://www.berkeleytime.com/api/grades/course_grades/" + courseID + "/"
            const request = $.ajax({url: gradeIDURL}).done(function (response) {  

                var gradeIDArr = []; 
                console.log(response.length);
                for (var i = 0; i < response.length; i++) {
                    var instructor = response[i].instructor;
                    if (instructor == button.getAttribute("instructor")) {
                        gradeIDArr.push(response[i].grade_id);
                    }
                }
                var gradeDataURL = "https://www.berkeleytime.com/api/grades/sections/" + gradeIDArr.join("&") + "/";
                
                var container = document.createElement("div");
                container.className = "grade-container hide";

                var popup = document.createElement("div");
                popup.className = "grade-popup";


                popup.innerHTML = firstName + " " + lastName;
                var graph = gradeDistribution(gradeDataURL);
                popup.appendChild(graph);

                container.appendChild(popup);
                parent.append(container);
                container.className = "grade-container show"      
                
                console.log(popup);

            })
                .fail(function (Response) {
            });;
        } else {
            containerCheck.className = "grade-container show";

        }
    }
}


function gradeDistribution(gradeDataURL) {
    var graph = document.createElement('canvas');
    graph.width = "1200";
    graph.height = "800";
    var grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'P', 'NP'];
    var values = [];

    const request = $.ajax({url: gradeDataURL}).done(function (response) {  
    
        for (letter of grades) {
            values.push(response[letter].percent);
        } 
        console.log(values);
        editInfo(graph, grades, values);
    
    })
        .fail(function (Response) {
            values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            editInfo(graph, grades, values);
    });;
    return graph;

}

function editInfo(graph, grades, values) {
    var ctx = graph.getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: grades,
            datasets: [{
                fillColor: "#79D1CF",
                strokeColor: "#79D1CF",
                data: values
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function removeInfo(button, parent) {
    return function(){
        var container = parent.querySelector(".grade-container")
        if (container) {
            container.className="grade-container hide";
        }   
      }
}


function requestGrades(simpleCourseTitle) {
    btAPI = "https://www.berkeleytime.com/api/grades/grades_json/?form=long";
}
 
