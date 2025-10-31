import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Add project count
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `Projects (${projects.length})`;
}

// Initial render of all projects
renderProjects(projects, projectsContainer, 'h2');

// Set up D3 generators
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;

// Function to render the pie chart
function renderPieChart(projectsGiven) {
  // Calculate rolled data - group projects by year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  
  // Convert to data format needed for pie chart
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  
  // Create slice generator
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));
  
  // Clear existing SVG paths and legend items
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();
  
  // Draw pie chart wedges
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', selectedIndex === i ? 'selected' : '')
      .on('click', () => {
        // Toggle selection
        selectedIndex = selectedIndex === i ? -1 : i;
        
        // Update wedge classes
        svg
          .selectAll('path')
          .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));
        
        // Update legend classes
        legend
          .selectAll('li')
          .attr('class', (_, idx) => (selectedIndex === idx ? 'legend-item selected' : 'legend-item'));
        
        // Filter projects based on selection
        if (selectedIndex === -1) {
          renderProjects(projectsGiven, projectsContainer, 'h2');
        } else {
          let selectedYear = data[selectedIndex].label;
          let filteredProjects = projectsGiven.filter(p => p.year === selectedYear);
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });
  
  // Create legend
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', selectedIndex === idx ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Trigger the same click behavior as the wedge
        svg.select(`path:nth-child(${idx + 1})`).dispatch('click');
      });
  });
}

// Initial pie chart render
renderPieChart(projects);

// Search functionality
let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // Update query value
  query = event.target.value;
  
  // Reset selection when searching
  selectedIndex = -1;
  
  // Filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  
  // Render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  
  // Update pie chart with filtered projects
  renderPieChart(filteredProjects);
});