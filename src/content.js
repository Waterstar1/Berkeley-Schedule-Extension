getCatalog();

SPECIAL_CASES_ABBR = {ARESEC: "A,RESEC"};
SPECIAL_CASES_NUMBER = {};

function getCatalog() {
    btAPI = "https://www.berkeleytime.com/api/grades/grades_json/?form=long";
    const request = $.ajax({url: btAPI}).done(function (response) {
        var catalog = response.courses;
        toCourseIDS = new Map();
        for(key in catalog) {
            var value = catalog[key];
            var courseTitle = value.title;
            var courseAbbr = value.abbreviation;
            var courseNum = value.course_number
            var courseKey = courseAbbr + courseNum + courseTitle.toLowerCase().replace(new RegExp("\\s+", "g"), "");
            toCourseIDS.set(courseKey, value.id);
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

        // Finds course title for respective professors
        var courseTitle = item.parentNode.querySelector('.ls-course-title').innerHTML;
        var simpleCourseTitle = courseTitle.toLowerCase().replace(new RegExp("\\s+", "g"), "")
        
        // Finds course section name for respective professors
        var courseSectionName = item.parentNode.querySelector('.ls-section-name').innerHTML.trim().split(" ");
        var courseAbbr = courseSectionName[0];

        //Checks if courseAbbr is a special case
        if (SPECIAL_CASES_ABBR.hasOwnProperty(courseAbbr)) {
            courseAbbr = SPECIAL_CASES[courseAbbr];
        }

        var courseNum = courseSectionName[1];
        //Checks if courseAbbr is a special case
        if (SPECIAL_CASES_NUMBER.hasOwnProperty(courseNum)) {
            courseAbbr = SPECIAL_CASES[courseNum];
        }

        var courseKey = courseAbbr + courseNum + simpleCourseTitle

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

            lookUpInstructor(firstName, lastName, additional, courseKey);
        }
    }
}

/* Retrieves instructor data from RateMyProfessor API */
function lookUpInstructor(firstName, lastName, element, courseKey) {
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

        editPage(OR, LoD, NoR, element, firstName, lastName, courseKey);
    })
        .fail(function (Response) {
    });;
}

/* Adds RateMyProfessor data to Berkeley schedule website */
function editPage(OR, LoD, NoR, additional, firstName, lastName, courseKey) {

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
    button.setAttribute("courseKey", courseKey);

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
            var courseID = toCourseIDS.get(button.getAttribute("courseKey"));
            if (typeof courseID !== 'undefined') {
                var gradeIDURL = "https://www.berkeleytime.com/api/grades/course_grades/" + courseID + "/"

                const request = $.ajax({url: gradeIDURL}).done(function (response) {  

                    var gradeIDArr = []; 
                    var allGradeIDArr = [];
                    for (var i = 0; i < response.length; i++) { 
                        var instructor = response[i].instructor;
                        var grade_id = response[i].grade_id
                        if (instructor == button.getAttribute("instructor")) {
                            gradeIDArr.push(grade_id);
                        }
                        allGradeIDArr.push(grade_id);
                    }

                    var gradeDataURL;
                    var titleText;
                    if (gradeIDArr.length > 0) {
                        gradeDataURL = "https://www.berkeleytime.com/api/grades/sections/" + gradeIDArr.join("&") + "/";
                        titleText = firstName + " " + lastName + "'s Grade Distribution";
                        
                    } else {
                        gradeDataURL = "https://www.berkeleytime.com/api/grades/sections/" + allGradeIDArr.join("&") + "/";
                        titleText = "All Sections Grade Distribution";
                    }
                    
                    var container = document.createElement("div");
                    container.className = "grade-container hide";

                    var popup = document.createElement("div");
                    popup.className = "grade-popup";

                    var title = document.createElement("div");
                    title.className = "grade-title";
                    title.innerText = titleText;

                    popup.append(title);
                    addGradeInfo(gradeDataURL, popup);
                    
                    container.appendChild(popup);
                    parent.append(container);
                    container.className = "grade-container show"      

                })
                    .fail(function (Response) {
                });;
            } else {
                var container = document.createElement("div");
                container.className = "grade-container hide";
                parent.append(container);
                container.className = "grade-container show"   
            }
        } else {
            containerCheck.className = "grade-container show";

        }
    }
}


function addGradeInfo(gradeDataURL, popup) {
    var graph = document.createElement('canvas');
    graph.width = "1200";
    graph.height = "800";
    var grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'P', 'NP'];
    var values = [];
    
    var bothGPA = document.createElement('div');
    bothGPA.className = "grade-gpa"
    var sectionGPA = document.createElement('span');
    var courseGPA = document.createElement('span');
    bothGPA.append(sectionGPA);
    bothGPA.append(courseGPA);

    const request = $.ajax({url: gradeDataURL}).done(function (response) {  
    
        for (letter of grades) {
            var percent = response[letter].percent
            values.push(percent);
        } 
        gradeDistribution(graph, grades, values);
        sectionGPA.innerHTML = "Section GPA: " + response["section_gpa"] + " &#9679 ";
        courseGPA.innerHTML = "Course GPA: " + response["course_gpa"];
    
    })
        .fail(function (Response) {
            values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            gradeDistribution(graph, grades, values);
            sectionGPA.innerText = "Section GPA: N/A &#9679 ";
            courseGPA.innerText = "Course GPA: N/A";
    });
    popup.append(bothGPA);
    popup.append(graph);
}

function gradeDistribution(graph, grades, values) {
    var ctx = graph.getContext("2d");
    var myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: grades,
            datasets: [{
                label: "Percentages",
                backgroundColor: "#2e8ed6", 
                data: values
            }],
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
