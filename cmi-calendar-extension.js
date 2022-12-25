// https://stackoverflow.com/questions/47372724/how-to-embed-css-files-in-a-firefox-web-extension
// https://stackoverflow.com/questions/14494747/how-to-add-images-to-readme-md-on-github
// https://stackoverflow.com/a/14494775

// Parsing CMI timetable
let timetables = [];
document.querySelectorAll('.page_content tr div')
        .forEach(timetable => {
            timetables.push(timetable.innerText);
        });

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const durations = timetables[0].trim()
                                .split('\n')[4]
                                .split('|')
                                .slice(1, -1);

let courses = new Map();
timetables.forEach(timetable => {
    const lines = timetable.trim().split('\n');

    for (let i = 15; i < lines.length; i++) {
        // The course line looks like "<subjectCode>: <subject description>", the regex gets the code.
        // We trim because there can be extra spaces between the code and :
        let code = lines[i].match(/^(.*):/)[1].trim();
        courses.set(code, {
            description: lines[i],
            schedule: new Set(),
        });
    }

    for (let i = 6; i < 11; i++) {
        lines[i].split('|')
                .slice(1, -1)
                .forEach((lecture, j) => {
                    if (lecture.trim() === '') {
                        return;
                    }
                    // We store the indices in a string as we want to prevent duplicates
                    // (as different arrays are considered unequal even if they match elementwise).
                    courses.get(lecture.trim()).schedule.add(`${i - 6} ${j}`);
                });
    }
});


// Extension GUI
let extension = document.createElement('div');
extension.id = 'cmi-calendar-extension';

// Timetable
let extensionTimetable = document.createElement('table');

let thead = document.createElement('thead');
let tr = document.createElement('tr');
let blankTh = document.createElement('th');
tr.appendChild(blankTh);
durations.forEach(duration => {
    let th = document.createElement('th');
    th.innerText = duration;
    tr.appendChild(th);
});
thead.appendChild(tr);
extensionTimetable.appendChild(thead);

let tbody = document.createElement('tbody');
days.forEach(day => {
    let tr = document.createElement('tr');

    let td = document.createElement('td');
    td.innerText = day;
    tr.appendChild(td);

    durations.forEach(() => {
        let td = document.createElement('td');
        // We create a span to create a flex container which holds the different subject codes.
        let span = document.createElement('span');
        td.appendChild(span);
        tr.appendChild(td);
    });

    tbody.appendChild(tr);
});
extensionTimetable.appendChild(tbody);

extension.appendChild(extensionTimetable);

// Selected courses
let selectedCourses = document.createElement('div');
selectedCourses.id = 'selected-courses';

let selectedCoursesHeading = document.createElement('h2');
selectedCoursesHeading.innerText = 'Selected courses';
selectedCourses.appendChild(selectedCoursesHeading);

extension.appendChild(selectedCourses);

// Other courses
let otherCourses = document.createElement('div');
otherCourses.id = 'other-courses';

let otherCoursesHeading = document.createElement('h2');
otherCoursesHeading.innerText = 'Other courses';
otherCourses.appendChild(otherCoursesHeading);

function addSelectedCourse(code, course) {
    let timetableSpans = [];

    function removeSpans() {
        timetableSpans.forEach(span => span.remove());
        timetableSpans = [];
    }

    function addSpans() {
        removeSpans();
        course.schedule.forEach(timing => {
            let [i, j] = timing.split(' ').map(Number);
            let span = document.createElement('span');
            span.innerText = code;
            extensionTimetable.querySelectorAll('tr')[i+1]
                                .querySelectorAll('td')[j+1]
                                .children[0]
                                .appendChild(span);
            timetableSpans.push(span);
        });
    }

    addSpans();

    let selectedCourseDiv = document.createElement('div');

    let displayAndDescription = document.createElement('div');

    let display = document.createElement('input');
    display.type = 'checkbox';
    display.checked = true;
    display.addEventListener('change', () => {
        if (display.checked) {
            addSpans();
        }
        else {
            removeSpans();
        }
    });
    displayAndDescription.appendChild(display);

    let courseDescription = document.createElement('span');
    courseDescription.innerText = course.description;
    displayAndDescription.appendChild(courseDescription);

    selectedCourseDiv.appendChild(displayAndDescription);

    let removeCourse = document.createElement('button');
    removeCourse.innerText = 'Remove';
    removeCourse.addEventListener('click', () => {
        selectedCourseDiv.remove();
        removeSpans();
        addOtherCourse(code, course);
    });
    selectedCourseDiv.appendChild(removeCourse);

    selectedCourses.appendChild(selectedCourseDiv);
}

function addOtherCourse(code, course, append) {
    let courseDiv = document.createElement('div');

    let courseDescription = document.createElement('span');
    courseDescription.innerText = course.description;
    courseDiv.appendChild(courseDescription);

    let addCourse = document.createElement('button');
    addCourse.innerText = 'Add';
    addCourse.addEventListener('click', () => {
        courseDiv.remove();
        addSelectedCourse(code, course);
    });
    courseDiv.appendChild(addCourse);

    if (append) {
        otherCourses.appendChild(courseDiv);
    }
    else {
        otherCoursesHeading.insertAdjacentElement("afterend", courseDiv);
    }
}

courses.forEach((course, code) => {
    addOtherCourse(code, course, true);
});

extension.appendChild(otherCourses);

document.querySelector('.page_content').appendChild(extension);