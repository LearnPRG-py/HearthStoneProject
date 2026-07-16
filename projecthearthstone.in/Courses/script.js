async function loadcourses () {
  try {
    const response = await fetch('courses-data.json')
    const courses = await response.json()
    rendercourses(courses)
  } catch (error) {
    console.error('Error loading course data:', error)
  }
}

function rendercourses (courses) {
  const container = document.getElementById('courses-container')

  courses.forEach((course) => {
    const firstClass = course.first ? ' zafirst' : ''
    const secClass = !course.first ? ' zasec' : ''
    const taglineText = course.subtitle
    const courseHTML = `
    <div class="course-section${firstClass}${secClass}" data-course="${course.id}" onclick="window.location.href='${course.onclick_url}'">
        <div class="course-banner" style="background-image: url('${course.backgroundImage}')">
            <h2 class="course-title">${course.title}</h2>
            <p class="course-tagline">${taglineText}</p>
        </div>
    </div>
`
    container.innerHTML += courseHTML
  })
}

document.addEventListener('DOMContentLoaded', loadcourses)
