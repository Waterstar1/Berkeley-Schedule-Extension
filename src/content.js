/**
 * Chrome Extension: Berkeley Professor Ratings
 * 
 * Version: 1.1.1
 * Author: Eustyn Trinh
 * 
 */ 

getCatalog();

// Special cases converting Course Abbr/Numbers, to that represented in Berkeley Time API
SPECIAL_CASES_ABBR = {ARESEC: "A,RESEC", SSEASM: "S,SEASN", LS: "L&S", ENERES: "ENE,RES"}
SPECIAL_CASES_NUMBER = {};

/* Retrieves catalog from Berkeley Time API */
function getCatalog() {
    btAPI = "https://www.berkeleytime.com/api/grades/grades_json/?form=long";
    const request = $.ajax({url: btAPI}).done(function (response) {
        var catalog = response.courses;

        // Creates map from key to course_id, for faster retrieval
        toCourseIDS = new Map();
        for(let key in catalog) {
            var value = catalog[key];

            // Key is a combination of course Abbr/Number/Title
            var courseTitle = value.title;
            var courseAbbr = value.abbreviation.replace(new RegExp("\\s+", "g"), "");
            var courseNum = value.course_number
            var courseKey = courseAbbr + courseNum + courseTitle.toLowerCase().replace(new RegExp("\\s+", "g"), "");

            toCourseIDS.set(courseKey, value.id);
        }

        addInfo();
    })
        .fail(function (Response) {
        // Fails to get catalog, extension does nothing.
    });;
}

/* Process to begin editing page */
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
            courseAbbr = SPECIAL_CASES_ABBR[courseAbbr];
        }

        var courseNum = courseSectionName[1];
        //Checks if courseAbbr is a special case
        if (SPECIAL_CASES_NUMBER.hasOwnProperty(courseNum)) {
            courseAbbr = SPECIAL_CASES_NUMBER[courseNum];
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

        // Checks if properties are present, else sents to '--' 
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
        // Fails to get RMP call, extension does nothing.
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

/* Creates popup and displays it if already created */
function showInfo(button, parent, firstName, lastName) {
    return function() {

        // See if container is present already
        var containerCheck = parent.querySelector(".grade-container");

        if (!containerCheck) {

            // Retrieves courseID from map
            var courseID = toCourseIDS.get(button.getAttribute("courseKey"))

            // If courseID is present, look it up, else create dummy button
            if (typeof courseID !== 'undefined') {
                var gradeIDURL = "https://www.berkeleytime.com/api/grades/course_grades/" + courseID + "/"

                const request = $.ajax({url: gradeIDURL}).done(function (response) {  

                    // Creates ID arrays in order to form Berkeley Time URLS for grade data
                    var gradeIDArr = []; 
                    var allGradeIDArr = [];
                    for (let i = 0; i < response.length; i++) { 
                        var instructor = response[i].instructor;
                        var grade_id = response[i].grade_id
                        if (instructor == button.getAttribute("instructor")) {
                            gradeIDArr.push(grade_id);
                        }
                        allGradeIDArr.push(grade_id);
                    }

                    var gradeDataURL;
                    var titleText;

                    // If ID Array with particular professor is not empty, set URL to that, else set it to the general section
                    if (gradeIDArr.length > 0) {
                        gradeDataURL = "https://www.berkeleytime.com/api/grades/sections/" + gradeIDArr.join("&") + "/";
                        titleText = firstName + " " + lastName + "'s Grade Distribution";
                        
                    } else {
                        gradeDataURL = "https://www.berkeleytime.com/api/grades/sections/" + allGradeIDArr.join("&") + "/";
                        titleText = "All Sections Grade Distribution";
                    }
                    
                    // Create container for popup
                    var container = document.createElement("div");
                    container.className = "grade-container hide";
                    
                    // Create popup
                    var popup = document.createElement("div");
                    popup.className = "grade-popup";

                    // Create popup title
                    var title = document.createElement("div");
                    title.className = "grade-title";
                    title.innerText = titleText;

                    popup.append(title);
                    addGradeInfo(gradeDataURL, popup);
                    
                    // Attach popup to container, and container to page
                    container.appendChild(popup);
                    parent.append(container);

                    // Show container
                    container.className = "grade-container show"      

                })
                    .fail(function (Response) {
                        // If fails, set container to dummy container
                        var container = document.createElement("div");
                        container.className = "grade-container hide";
                        parent.append(container);
                        container.className = "grade-container show" 
                });;
            } else {
                // If courseID not present, set container to dummy container
                var container = document.createElement("div");
                container.className = "grade-container hide";
                parent.append(container);
                container.className = "grade-container show"   
            }
        } else {
            // Shows popup when hovering button
            containerCheck.className = "grade-container show";
        }
    }
}

/* Creates and adds popup content to the actual popup */
function addGradeInfo(gradeDataURL, popup) {

    // Create a canvas for chart.js
    var graph = document.createElement('canvas');
    graph.width = "1200";
    graph.height = "800";

    // Create data for grade distribution
    var grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'P', 'NP'];
    var values = [];

    // Creates division on popup to display course/section gpas
    var bothGPA = document.createElement('div');
    bothGPA.className = "grade-gpa"

    var sectionGPA = document.createElement('span');
    var courseGPA = document.createElement('span');

    bothGPA.append(sectionGPA);
    bothGPA.append(courseGPA);

    // Requests grade data from Berkeley Time API
    const request = $.ajax({url: gradeDataURL}).done(function (response) {  
        
        // Extracts percentages from json response
        for (let letter of grades) {
            var percent = response[letter].percent
            values.push(percent * 100);
        } 

        // If class is PNP, calculate percentages
        values = checkPNP(values, response);

        // Set section and course data text 
        sectionGPA.innerHTML = "Section GPA: " + response["section_gpa"] + " &#9679 ";
        courseGPA.innerHTML = "Course GPA: " + response["course_gpa"];

        // Create grade distribution graph
        gradeDistribution(graph, grades, values);
    
    })
        .fail(function (Response) {
            // If call fails, set graph values to default
            values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            gradeDistribution(graph, grades, values);
            sectionGPA.innerText = "Section GPA: N/A &#9679 ";
            courseGPA.innerText = "Course GPA: N/A";
    });

    // Append elements to popup
    popup.append(bothGPA);
    popup.append(graph);
}

/* Sets P/NP values to respective percentages based on number students */
function checkPNP(values, response) {

    // If not PNP class, return default
    if (response.section_gpa != -1.0) {
        return values;
    } 
    
    var p = response.P.numerator;
    var np = response.NP.numerator;

    // Calculates percentages for P/NP and adds to values
    var pPercent = p / (p + np);
    var npPercent = np / (p + np);
    values[values.length - 2] = pPercent * 100;
    values[values.length - 1] = npPercent * 100;

    return values; 
}

/* Creates bar chart with grade data and attaches it to canvas */
function gradeDistribution(graph, grades, values) {

    // Format for create chart with Chart.js
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

/* Handles mouse leaving button event */
function removeInfo(button, parent) {
    return function(){
        
        /* Hide container if container present */
        var container = parent.querySelector(".grade-container")
        if (container) {
            container.className="grade-container hide";
        }   
      }
}
