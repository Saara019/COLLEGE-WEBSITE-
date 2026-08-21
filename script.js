(function() {
  'use strict';
 
  function isMobile() { return window.innerWidth <= 900; }
 
  // Tap-to-toggle dropdown flyouts on mobile
  // (hover doesn't work on touch screens)
  document.querySelectorAll('.sidebar-nav > li.has-dd > a').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (!isMobile()) return;
      var li = this.closest('li.has-dd');
      var href = this.getAttribute('href');
      // Only intercept links that are '#' (purely menu triggers)
      if (!href || href !== '#') return;
      e.preventDefault();
      e.stopPropagation();
      li.classList.toggle('mob-dd-open');
    });
  });
 
  // Close mobile nav when any flyout link is tapped
  document.querySelectorAll('.sidebar-flyout a, .sidebar-sub-flyout a').forEach(function(a) {
    a.addEventListener('click', function() {
      if (!isMobile()) return;
      var nav = document.getElementById('sideNav');
      var toggle = document.getElementById('mobToggle');
      if (nav) nav.classList.remove('mob-open');
      if (toggle) toggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
 
  // Make auto-popup scrollable on small screens
  var popup = document.getElementById('autoPopup');
  if (popup) {
    var inner = popup.querySelector('div');
    if (inner) {
      inner.style.maxHeight = '90vh';
      inner.style.overflowY = 'auto';
      inner.style.webkitOverflowScrolling = 'touch';
    }
  }
 
  // iOS momentum scrolling on overlay pages
  ['#stcPage','#eventsPage','#noticesPage','#facilityPage',
   '#coPage','#admPage','#parentBodyPage'].forEach(function(sel) {
    var el = document.querySelector(sel);
    if (el) el.style.webkitOverflowScrolling = 'touch';
  });
 
})();


/* ══════════════════════════════════════════════
   INFINITE SCROLL ENGINE — FIXED & UNIFIED
   Works for alumni, faculty, and gallery tracks.
══════════════════════════════════════════════ */
function createInfiniteScroll(trackId, wrapId, origLen, cardW, speed) {
  const track = document.getElementById(trackId);
  const wrap  = document.getElementById(wrapId);
  if (!track || !wrap) return null;

  let pos     = origLen * cardW;
  let running = true;
  let rafId   = null;

  // ── start at second copy so we can loop both ways ──
  track.style.transform = `translateX(-${pos}px)`;

  function step() {
    if (!running) return;
    pos += speed;
    // forward loop
    if (pos >= origLen * 2 * cardW) {
      pos -= origLen * cardW;
      track.style.transition = 'none';
      track.style.transform  = `translateX(-${pos}px)`;
      track.getBoundingClientRect(); // force reflow
    }
    track.style.transition = 'none';
    track.style.transform  = `translateX(-${pos}px)`;
    rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame(step);

  // pause on hover
  wrap.addEventListener('mouseenter', () => { running = false; cancelAnimationFrame(rafId); });
  wrap.addEventListener('mouseleave', () => { running = true;  rafId = requestAnimationFrame(step); });

  // touch / drag scroll
  let touchStartX = 0, touchStartPos = 0;
  wrap.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartPos = pos; running = false; cancelAnimationFrame(rafId); }, {passive:true});
  wrap.addEventListener('touchmove',  e => {
    const dx = touchStartX - e.touches[0].clientX;
    pos = touchStartPos + dx;
    track.style.transform = `translateX(-${pos}px)`;
  }, {passive:true});
  wrap.addEventListener('touchend',   () => { running = true; rafId = requestAnimationFrame(step); });

  return { stop: () => { running = false; cancelAnimationFrame(rafId); } };
}

/* ══ STATE ══ */
let currentDept = null;
let coHeroSlideInterval = null, coHlSlideInterval = null, stcHeroInterval = null;
let coHeroIdx = 0, coHlIdx = 0;
let galleryImages = [], galleryCurrentIdx = 0;
const scrollControllers = {}; // { alumniTrack_X, facultyTrack_X, galTrack_X }

/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
function openLightbox(src){document.getElementById('sylLightboxImg').src=src;document.getElementById('sylLightbox').classList.add('open');}
function closeLightbox(e){if(e.target===document.getElementById('sylLightbox'))document.getElementById('sylLightbox').classList.remove('open');}
function openGalleryLb(imgs,idx){galleryImages=imgs;galleryCurrentIdx=idx;document.getElementById('galleryLbImg').src=imgs[idx];document.getElementById('galleryLb').classList.add('open');}
function closeGalleryLb(){document.getElementById('galleryLb').classList.remove('open');}
function galleryLbNav(dir){galleryCurrentIdx=(galleryCurrentIdx+dir+galleryImages.length)%galleryImages.length;document.getElementById('galleryLbImg').src=galleryImages[galleryCurrentIdx];}
document.getElementById('galleryLb').addEventListener('click',function(e){if(e.target===this)closeGalleryLb();});

/* ══════════════════════════════════════════════
   HERO SLIDESHOW
══════════════════════════════════════════════ */
(function initHero(){
  const slides=document.querySelectorAll('.slide');
  const dotsWrap=document.getElementById('slideshowDots');
  const pb=document.getElementById('prog');
  const DUR=5000;let cur=0,si,paused=false;
  slides.forEach((_,i)=>{const d=document.createElement('div');d.className='dot'+(i===0?' active':'');d.setAttribute('data-s',i);d.addEventListener('click',()=>{clearInterval(si);showSlide(i);si=setInterval(next,DUR);});dotsWrap.appendChild(d);});
  function showSlide(i){slides.forEach(s=>s.classList.remove('active','fade-out'));document.querySelectorAll('.dot').forEach(d=>d.classList.remove('active'));slides[i].classList.add('active');document.querySelectorAll('.dot')[i].classList.add('active');cur=i;pb.style.transition='none';pb.style.width='0%';void pb.offsetWidth;pb.style.transition=`width ${DUR}ms linear`;pb.style.width='100%';}
  function next(){slides[cur].classList.add('fade-out');cur=(cur+1)%slides.length;setTimeout(()=>showSlide(cur),300);}
  showSlide(0);si=setInterval(next,DUR);
  document.querySelector('.slideshow-wrap').addEventListener('mouseenter',()=>{if(!paused){clearInterval(si);paused=true;const w=window.getComputedStyle(pb).width;pb.style.transition='none';pb.style.width=w;}});
  document.querySelector('.slideshow-wrap').addEventListener('mouseleave',()=>{if(paused){const r=100-parseFloat(pb.style.width),rt=(r/100)*DUR;pb.style.transition=`width ${rt}ms linear`;pb.style.width='100%';setTimeout(()=>{next();clearInterval(si);si=setInterval(next,DUR);},rt);paused=false;}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(si)clearInterval(si);showSlide(0);si=setInterval(next,DUR);}});
})();

/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */
(function initSidebar(){
  const hero=document.querySelector('.hero');
  const heroCenter=document.getElementById('heroCenter');
  const heroDefault=document.getElementById('heroDefault');
  const allC=['c-home','c-about','c-courses','c-short-courses','c-events','c-notices','c-facilities','c-contact'];
  document.querySelectorAll('.sidebar-nav>li>a').forEach(a=>{
    a.addEventListener('mouseenter',function(){hero.classList.remove(...allC);const cc=this.getAttribute('data-color');if(cc)hero.classList.add(`c-${cc}`);heroCenter.classList.add('show');heroDefault.classList.add('hide');});
    a.addEventListener('mouseleave',function(){hero.classList.remove(...allC);heroCenter.classList.remove('show');heroDefault.classList.remove('hide');});
  });
  document.getElementById('mobToggle').addEventListener('click',function(){
    const n=document.getElementById('sideNav');n.classList.toggle('mob-open');
    this.innerHTML=n.classList.contains('mob-open')?'<i class="fas fa-times"></i>':'<i class="fas fa-bars"></i>';
  });
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
      const id=this.getAttribute('href');if(id==='#'||id==='#enroll')return;e.preventDefault();
      const el=document.querySelector(id);if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.pageYOffset-20,behavior:'smooth'});
      document.getElementById('sideNav').classList.remove('mob-open');
      document.getElementById('mobToggle').innerHTML='<i class="fas fa-bars"></i>';
    });
  });
})();

function goHome(){document.getElementById('coPage').classList.remove('on');closeAllPages();window.scrollTo({top:0,behavior:'smooth'});}
function closeAllPages(){['stcPage','eventsPage','noticesPage','facilityPage'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('open');});document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   AUTO POPUP
══════════════════════════════════════════════ */
function closeAutoPopup(){document.getElementById('autoPopup').style.display='none';document.body.style.overflow='';}
document.getElementById('autoPopup').addEventListener('click',function(e){if(e.target===this)closeAutoPopup();});
window.addEventListener('load', function() {
  // Only show popup if visiting the plain home page (no hash / hash is home)
  const hash = window.location.hash.replace('#', '');
  const params = {};
  hash.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  const isHome = !hash || params.page === 'home' || !params.page;
  if (isHome) {
    setTimeout(() => {
      document.getElementById('autoPopup').style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }, 1000);
  }
});

/* ══════════════════════════════════════════════
   COMMITTEE PDF
══════════════════════════════════════════════ */
const committeePDFs={
  'anti-ragging':{label:'Anti Ragging Committee',files:{'2025':'ANTIRAG.PDF'}},
  'grievance':{label:'Grievance Redressal Committee',files:{'2025':'grievance_2024_25.pdf'}}
};
function openCommitteePDF(committee,year){
  const data=committeePDFs[committee];if(!data)return;
  const file=data.files[year];if(!file){alert('PDF not available for this year yet.');return;}
  const yearLabel=year==='2025'?'2024–25':year==='2024'?'2023–24':'2022–23';
  document.getElementById('pdfModalTitle').textContent=`${data.label} — ${yearLabel}`;
  document.getElementById('pdfModalIframe').src=file;
  document.getElementById('pdfDownloadBtn').href=file;
  document.getElementById('pdfDownloadBtn').download=file;
  document.getElementById('pdfOpenBtn').href=file;
  document.getElementById('pdfModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closePdfModal(){document.getElementById('pdfModal').classList.remove('open');document.getElementById('pdfModalIframe').src='';document.body.style.overflow='';}
document.getElementById('pdfModal').addEventListener('click',function(e){if(e.target===this)closePdfModal();});

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const stcCourses=[
  {title:'Warli Painting',dept:'Applied Art',deptColor:'#8b5cf6',img:'warli.jpeg',credits:'N/A',duration:'10 hrs / 5 days',fee:'₹1,000',feeNote:'incl. materials',eligibility:'S.S.C.',timing:'1:30 – 3:30 pm (Mon–Fri)',medium:'English / Hindi / Marathi',syllabus:['Understanding traditional Warli art & tribal culture','Using basic shapes in drawing','Learning figure drawing with proportion','Creating patterns and compositions','Making a complete village theme artwork'],contact:'9819393555, 9773240872',link:'https://forms.gle/7gRPLtjE732owPt7A'},
  {title:'Opaque Painting',dept:'Applied Art',deptColor:'#8b5cf6',img:'opaque.jpeg',credits:'N/A',duration:'10 hrs / 5 days',fee:'₹2,000',feeNote:'incl. materials',eligibility:'S.S.C.',timing:'1:30 – 3:30 pm (Mon–Fri)',medium:'English / Hindi / Marathi',syllabus:['Understanding opaque paint techniques','Colour mixing and layering','Creating textures and effects','Composition principles','Completing a finished artwork'],contact:'9819393555, 9773240872',link:'https://forms.gle/7gRPLtjE732owPt7A'},
  {title:'Painting with water colors',dept:'Applied Art',deptColor:'#8b5cf6',img:'paint.jpeg',credits:'N/A',duration:'10 hrs / 5 days',fee:'₹2,000',feeNote:'incl. materials',eligibility:'S.S.C.',timing:'1:30 – 3:30 pm (Mon–Fri)',medium:'English / Hindi / Marathi',syllabus:['Introduction to watercolor materials','Wet-on-wet and wet-on-dry techniques','Color washes and gradients','Landscape and still-life painting','Final composition'],contact:'9819393555, 9773240872',link:'https://forms.gle/7gRPLtjE732owPt7A'},
  {title:'Drawing and Sketching',dept:'Applied Art',deptColor:'#8b5cf6',img:'drawing.jpeg',credits:'N/A',duration:'10 hrs / 5 days',fee:'₹2,000',feeNote:'incl. materials',eligibility:'S.S.C.',timing:'1:30 – 3:30 pm (Mon–Fri)',medium:'English / Hindi / Marathi',syllabus:['Basic lines and shapes','Proportion and perspective','Shading and texture','Figure sketching','Portfolio sketch'],contact:'9819393555, 9773240872',link:'https://forms.gle/7gRPLtjE732owPt7A'},
  {title:'Calligraphy',dept:'Applied Art',deptColor:'#8b5cf6',img:'calligraphy.jpeg',credits:'N/A',duration:'10 hrs / 5 days',fee:'₹1,500',feeNote:'incl. materials',eligibility:'S.S.C.',timing:'1:30 – 3:30 pm (Mon–Fri)',medium:'English / Hindi / Marathi',syllabus:['Tools and materials for calligraphy','Basic strokes and letterforms','English calligraphy styles','Decorative layouts','Final calligraphy artwork'],contact:'9819393555, 9773240872',link:'https://forms.gle/7gRPLtjE732owPt7A'},
  {title:'Short term Beauty Courses',dept:'Beauty Culture',deptColor:'#10b981',img:'b_sc.jpeg',credits:'1 Credit',duration:'30 hours',fee:'as per course opt',feeNote:'',eligibility:'Open to All',timing:'By Schedule',medium:'English',syllabus:['Saree basics','Daily & professional draping','Dupatta draping','Saree care & safety','Saree folding'],contact:'9892567636 / 7021912437'},
  {title:'Basic Professional Makeup Skills',dept:'Beauty Culture',deptColor:'#10b981',img:'makeupcourse.png',credits:'1 Credit',duration:'30 hours',fee:'₹3,000',feeNote:'',eligibility:'Open to All',timing:'By Schedule',medium:'English',syllabus:['Understanding skin types and face shapes','Basic base makeup','Eye makeup basics','Lip makeup','Natural / daily makeup look'],contact:'8892567636 / 7021912437'},
  {title:'Basic Nail Art & Nail Care',dept:'Beauty Culture',deptColor:'#10b981',img:'nail.png',credits:'1 Credit',duration:'30 hours',fee:'₹3,000',feeNote:'',eligibility:'Open to All',timing:'By Schedule',medium:'English',syllabus:['Nail fundamentals','Nail grooming & preparation','Basic nail art techniques','Professional nail styling','Safety & maintenance'],contact:'9892567636 / 7021912437'},
  {title:'Basic Saree Draping',dept:'Beauty Culture',deptColor:'#10b981',img:'sari.png',credits:'1 Credit',duration:'30 hours',fee:'₹3,000',feeNote:'',eligibility:'Open to All',timing:'By Schedule',medium:'English',syllabus:['Saree basics','Daily & professional draping','Dupatta draping','Saree care & safety','Saree folding'],contact:'9892567636 / 7021912437'},
  {title:'Beauty and skin care skills',dept:'Beauty Culture',deptColor:'#10b981',img:'b_sc2.jpeg',credits:'1 Credit',duration:'30 hours',fee:'₹3,000',feeNote:'',eligibility:'Open to All',timing:'By Schedule',medium:'English',syllabus:['Skin analysis','Cleansing and toning','Facial massage techniques','Mask application','Professional skincare routine'],contact:'9892567636 / 7021912437'},
  {title:'Interior Design Certificate Course',dept:'Interior Design',deptColor:'#f97316',img:'iddcourse.png',credits:'Certificate',duration:'4 Weeks',fee:'₹2,000',feeNote:'',eligibility:'S.S.C.',timing:'2:30 – 5:30 pm',medium:'English',syllabus:['Fundamentals of interior design','Sketching & drafting skills','Rendering techniques','Planning & layout','Visual presentation'],contact:'interiordeptscnip25@gmail.com'},
  {title:'Space Model Making',dept:'Interior Design',deptColor:'#f97316',img:'model.png',credits:'Certificate',duration:'5 Days (4 hrs/day)',fee:'₹2,500',feeNote:'min. 20 students',eligibility:'Beginners Welcome',timing:'By Schedule',medium:'English',syllabus:['Introduction to model making materials','Scale & proportion fundamentals','Structural model construction','Site & landscape representation','Final presentation of space model'],contact:'Sunil V. Mestry — Interior Designer'},
  {title:'Autocad Drawing',dept:'Interior Design',deptColor:'#f97316',img:'autocad.jpeg',credits:'Certificate',duration:'5 Days (4 hrs/day)',fee:'₹4,000',feeNote:'min. 20 students',eligibility:'Beginners Welcome',timing:'By Schedule',medium:'English',syllabus:['AutoCAD interface basics','2D drawing and editing','Layers and dimensions','Floor plan creation','Printing and presentation'],contact:'Sunil V. Mestry — Interior Designer'},
  {title:'Basic Tie and dyeing',dept:'Fashion Design',deptColor:'#f97316',img:'fc1.png',credits:'Certificate',duration:'5 Days (4 hrs/day)',fee:'₹4,999',feeNote:'min. 20 students',eligibility:'Beginners Welcome',timing:'By Schedule',medium:'English',syllabus:['Introduction to tie & dye','Folding and tying techniques','Dyeing process','Color combinations','Final fabric creation'],contact:'fashiondesigningdata@gmail.com'},
  {title:'Fabric Painting',dept:'Fashion Design',deptColor:'#f97316',img:'fc2.png',credits:'Certificate',duration:'5 Days (4 hrs/day)',fee:'₹4,999',feeNote:'min. 20 students',eligibility:'Beginners Welcome',timing:'By Schedule',medium:'English',syllabus:['Fabric types and preparation','Fabric paints and tools','Stenciling and freehand painting','Motif design','Final fabric art piece'],contact:'fashiondesigningdata@gmail.com'},
  {title:'Accessory Designing',dept:'Fashion Design',deptColor:'#f97316',img:'fc3.png',credits:'Certificate',duration:'5 Days (4 hrs/day)',fee:'₹4,999',feeNote:'min. 20 students',eligibility:'Beginners Welcome',timing:'By Schedule',medium:'English',syllabus:['Introduction to accessories','Jewellery and bag basics','Material selection','Design sketching','Creating a final accessory'],contact:'fashiondesigningdata@gmail.com'},
  {title:'Fashion Illustrations',dept:'Fashion Design',deptColor:'#f97316',img:'fc4.png',credits:'Certificate',duration:'5 Days (4 hrs/day)',fee:'₹4,999',feeNote:'min. 20 students',eligibility:'Beginners Welcome',timing:'By Schedule',medium:'English',syllabus:['Fashion figure proportions','Croquis sketching','Garment rendering','Colour and texture techniques','Portfolio illustration'],contact:'fashiondesigningdata@gmail.com'}
];

const eventsData={
  'applied-arts':{name:'Applied Art',color:'#8b5cf6',events:[
    {title:'Annual Art Exhibition 2024',date:'15 Jan 2025',desc:'Showcase of student artworks across painting, 3D model and digital media.',loc:'Main Gallery Hall',time:'10 AM – 6 PM',img:'art4.jpg'},
    {title:'Calligraphy Workshop',date:'22 Jan 2025',desc:'Hands-on workshop of Calligraphy.',loc:'Applied Art Studio',time:'2 PM – 5 PM',img:'calligraphy.jpeg'},
    {title:'Exhibition',date:'5 Feb 2025',desc:'3D models',loc:'Seminar Hall',time:'9 AM – 4 PM',img:'art_event2.jpeg'},
    {title:'Exhibition',date:'18 Feb 2025',desc:'Annual art work of students',loc:'Design Lab',time:'11 AM – 2 PM',img:'art_event4.jpeg'},
    {title:'Warli Workshop',date:'22 Jan 2025',desc:'Hands-on workshop of Warli Painting.',loc:'Applied Art Studio',time:'2 PM – 5 PM',img:'warli.jpeg'}
  ]},
  'fashion-design':{name:'Fashion Designing',color:'#ec4899',events:[
    {title:'Fashion Show 2025',date:'10 Mar 2025',desc:'Students showcase original designs on the runway.',loc:'College Auditorium',time:'5 PM – 9 PM',img:'f4.png'},
    {title:'Textile Industry Visit',date:'28 Jan 2025',desc:'Educational tour to a leading textile mill in Mumbai.',loc:'Jaipur',time:'9 AM – 3 PM',img:'f11.jpg'},
    {title:'Departmental Event',date:'12 Feb 2025',desc:'Event Work',loc:'In Campus',time:'10 AM – 1 PM',img:'f12.jpg'},
    {title:'Exhibition',date:'25 Feb 2025',desc:'Design original accessories using sustainable or recycled materials.',loc:'In Campus',time:'10 AM – 4 PM',img:'f13.jpg'}
  ]},
  'interior-design':{name:'Interior Designing',color:'#f97316',events:[
    {title:'Industrial visit',desc:'Modular furniture factory WOODONZ',loc:'Reay Road',img:'i_events1.jpg'},
    {title:'Industrial Visit',desc:'Visit to M/S EURO Decor Pvt. Ltd.',loc:'Silvasa',img:'i_events7.png'},
    {title:'Industrial Visit',desc:'The Italian Stone visit',loc:'Silvasa',img:'i_events8.png'},
    {title:'Industrial Visit',desc:'The Italian Stone Visit',loc:'Silvasa',img:'i_events9.png'},
    {title:'Industrial Visit',desc:'Stonemann Royale Ltd.',loc:'Silvasa',img:'i_events10.png'},
    {title:'On site Sketching',desc:'Khanvil Resort',loc:'Silvasa',img:'i_events11.png'},
    {title:'Co-Curriculum Activities',desc:'Blood Donation Drive at College',loc:'In Campus',img:'i_events5.png'},
    {title:'Co-Curriculum Activities',desc:'CleanUp Drive of Mangrooves',loc:'Nerul',img:'i_events3.png'},
    {title:'Exhibition',desc:'Students presenting their Models',loc:'In campus',img:'idd_hero3.jpg'},
    {title:'Exhibition',desc:'Students Visit to the Ace Exhibition',loc:'In Campus',img:'i_events6.png'},
    {title:'Counselling',desc:'Academic Counselling for students',loc:'In campus',img:'i_events12.png'},
    {title:'Counselling',desc:'Career Counselling for 12th',loc:'In campus',img:'idd_sub2.png'},
    {title:'Seminar',desc:'Seminar on Hospitality',loc:'In Campus',img:'i_events2.jpg'},
    {title:'Guest Lecture',desc:'Industry Expert Sachin Khatpe Creative Director Design\'s Studio 5',loc:'In Campus',img:'i_events4.png'},
    {title:'Workshop',desc:'Model Making Workshop for students',loc:'In campus',img:'i_events14.png'}
  ]},
  'beauty-culture':{name:'Beauty Culture',color:'#10b981',events:[
    {title:'Industrial Visit',date:'14 Feb 2025',desc:'Clinical Treatment',loc:'Beauty Studio',time:'10 AM – 4 PM',img:'b_event5.jpeg'},
    {title:'Industrial Visit',date:'25 Jan 2025',desc:'Visit to Denny Cosmetics',loc:'College Corridor',time:'11 AM – 5 PM',img:'b_event6.jpeg'},
    {title:'Makeup Competition',date:'8 Feb 2025',desc:'Work by students',loc:'Beauty Lab',time:'9 AM – 1 PM',img:'b_event8.jpeg'},
    {title:'College Events',date:'20 Mar 2025',desc:'Freshers Meet',loc:'Seminar Hall',time:'2 PM – 4 PM',img:'b_event7.jpeg'}
  ]}
};

const noticesData={
  'all':[
    {day:'10',month:'Apr',title:'Admission Open 2025–26 — All Departments',desc:'Applications for all diploma and certificate courses are now open. Last date: 30th April 2025.',type:'urgent',dept:'general'},
    {day:'08',month:'Apr',title:'Fashion Show 2025 — Registrations Open',desc:'Final year Fashion Design students to register for the annual runway show by 15th April.',type:'event',dept:'fashion-design'},
    {day:'05',month:'Apr',title:'Exam Schedule Released — MSBTE April 2025',desc:'The examination timetable for all MSBTE semester exams has been released.',type:'info',dept:'beauty-culture'},
    {day:'02',month:'Apr',title:'Library Timings Revised for Exam Season',desc:'Library will remain open till 7:00 PM on weekdays during the exam period.',type:'info',dept:'general'},
    {day:'28',month:'Mar',title:'Warli Painting Short Course — Last Batch Seats Available',desc:'Limited seats remain. Enroll at 9819393555 before 10th March.',type:'general',dept:'applied-arts'},
    {day:'25',month:'Mar',title:'Scholarship Portal Open — EBC & OBC Freeships',desc:'Students eligible for EBC/OBC freeship must submit applications by 5th April.',type:'urgent',dept:'general'}
  ],
  'applied-arts':[
    {day:'28',month:'Mar',title:'Warli Painting Short Course — Last Batch Seats Available',desc:'Limited seats remain for the Warli Painting short term course.',type:'general',dept:'applied-arts'},
    {day:'15',month:'Mar',title:'Annual Art Exhibition Entries Due',desc:'Students must submit final artwork entries for the Annual Art Exhibition 2025 by 20th March.',type:'event',dept:'applied-arts'},
    {day:'01',month:'Mar',title:'Illustration Masterclass Registration Open',desc:'Register for the upcoming Illustration Masterclass. Form available at the department office.',type:'info',dept:'applied-arts'}
  ],
  'fashion-design':[
    {day:'08',month:'Apr',title:'Fashion Show 2025 — Registrations Open',desc:'Final year Fashion Design students to register for the annual runway show by 15th April.',type:'event',dept:'fashion-design'},
    {day:'20',month:'Mar',title:'Fabric & Material Submission Deadline',desc:'Final year students must submit fabric sample collections for evaluation by 28th March.',type:'urgent',dept:'fashion-design'},
    {day:'10',month:'Mar',title:'Textile Industry Visit — Permission Slips Required',desc:'Students participating in the industry visit must return signed permission slips by 18th March.',type:'info',dept:'fashion-design'}
  ],
  'interior-design':[
    {day:'05',month:'Apr',title:'AutoCAD Lab — Revised Schedule',desc:'AutoCAD lab sessions rescheduled for the week of 14–18 April.',type:'info',dept:'interior-design'},
    {day:'22',month:'Mar',title:'Scale Model Submission — Final Year',desc:'Scale models for the Annual Student Exhibition must be submitted by 25th March.',type:'urgent',dept:'interior-design'},
    {day:'12',month:'Mar',title:'Space Model Making Short Course — Batch Forming',desc:'Minimum 20 students required. Register interest with the department by 15th March.',type:'event',dept:'interior-design'}
  ],
  'beauty-culture':[
    {day:'05',month:'Apr',title:'Exam Schedule Released — MSBTE April 2025',desc:'The examination timetable for all MSBTE semester exams has been released.',type:'info',dept:'beauty-culture'},
    {day:'01',month:'Apr',title:'Nail Art Course — New Batch Starting April 20',desc:'New batch for the Basic Nail Art & Nail Care short course begins April 20.',type:'event',dept:'beauty-culture'},
    {day:'18',month:'Mar',title:'Salon Training Schedule — Semester IV',desc:'The 8-week salon training schedule for Sem IV students has been released.',type:'info',dept:'beauty-culture'}
  ],
  'general':[
    {day:'10',month:'Apr',title:'Admission Open 2025–26 — All Departments',desc:'Applications for all diploma and certificate courses are now open.',type:'urgent',dept:'general'},
    {day:'02',month:'Apr',title:'Library Timings Revised for Exam Season',desc:'Library will remain open till 7:00 PM on weekdays during the exam period.',type:'info',dept:'general'},
    {day:'25',month:'Mar',title:'Scholarship Portal Open — EBC & OBC Freeships',desc:'Students eligible for EBC/OBC freeship must submit applications by 5th April.',type:'urgent',dept:'general'}
  ]
};

const deptPlanners={
  'applied-arts':{hod:'Mrs. Nalini Parab',month:'April 2025',pdfFile:'f_planner25-26.pdf',events:[]},
  'fashion-design':{hod:'Mrs. Pallavi Patekar',month:'April 2025',pdfFile:'f_planner25-26.pdf',events:[]}
};
const deptEnquiry={
  'applied-arts':{
    phone:'9819393555',
    whatsapp:'9819393555',
    email:'applieddeptscnip@gmail.com',
    batchInfo:'New batch starts June 2026',
    instagram:'https://www.instagram.com/appliedart_scni.polytechnic?igsh=MTkxaHlhZ3Rwb3ZucQ==',
    facebook:'https://www.facebook.com/diplomainappliedartscnip/',
    applyLink:'https://forms.gle/DeheEBLa6WcdFKb58'  // ← ADD THIS
  },
  'fashion-design':{
    phone:'7506744203 / 8097592389',
    whatsapp:'7506744203',
    email:'fashiondesigningdata@gmail.com',
    batchInfo:'Admissions open June–August 2026',
    instagram:'https://www.instagram.com/fashion_scnip?igsh=M2ptMHN1NTIzb2N3&utm_source=qr',
    facebook:'https://www.facebook.com/share/18UatAs3Sm/?mibextid=wwXIfr',
    applyLink:'https://forms.gle/DeheEBLa6WcdFKb58'  // ← ADD THIS
  },
  'interior-design':{
    phone:'9821054132',
    whatsapp:'9821054132',
    email:'interiordeptscnip25@gmail.com',
    batchInfo:'New batch starts June 2026',
    instagram:'https://www.instagram.com/interior_design_scnip?utm_source=qr&igsh=YW1scGFnOTBjZmdz',
    facebook:'https://www.facebook.com/share/18UatAs3Sm/?mibextid=wwXIfr',
    applyLink:'https://forms.gle/DeheEBLa6WcdFKb58'  // ← ADD THIS
  },
  'beauty-culture':{
    phone:'7021912437',
    whatsapp:'7021912437',
    email:'beautydeptscnip@gmail.com',
    batchInfo:'New batch starts June 2026',
    instagram:'https://www.instagram.com/diploma_beauty_hair?igsh=ZThheWZ4bW1jenUz&utm_source=qr',
    facebook:'https://www.facebook.com/share/18UatAs3Sm/?mibextid=wwXIfr',
    applyLink:'https://forms.gle/DeheEBLa6WcdFKb58'  // ← ADD THIS
  }
};
const deptGallery={
  'beauty-culture':[
    {src:'b11.jpeg',cap:'Hairstyle Training'},{src:'b12.jpeg',cap:'Laser Skincare'},{src:'b13.jpeg',cap:'Hair Treatment'},{src:'b14.jpg',cap:'Makeup Studio'},{src:'bd2.jpg',cap:'Beauty Lab'},{src:'bd3.jpg',cap:'Professional Makeover'},{src:'makeup.jpeg',cap:'Bridal Makeup'},{src:'b2.jpg',cap:'Salon Training'}
  ]
};

const alumniData={
  'applied-arts':[
    {name:'Priyanka Gunjal',batch:'Batch 2024-25',place:'Mumbai',role:'Art Director, DDB Mudra',photo:'art_alumni1.jpg'},
    {name:'Trisha Bobbla',batch:'Batch 2024-25',place:'Mumbai',role:'Senior Graphic Designer, Ogilvy',photo:'art_alumni2.jpg'},
    {name:'Usma Deheriya',batch:'Batch 2024-25',place:'Mumbai',role:'Freelance Illustrator & Brand Designer',photo:'art_alumni3.jpg'},
    {name:'Jayesh Sawal',batch:'Batch 2024-25',place:'Mumbai',role:'Creative Head, JWT Mumbai',photo:'art_alumni4.jpg'},
    {name:'Harshal Kanekar',batch:'Batch 2024-25',place:'Mumbai',role:'Illustrator, Angootha Chaap Studio',photo:'art_alumni5.jpg'}
  ],
  'fashion-design':[
    {name:'Vaishnavi Deshmukh',batch:'Batch 2019-20',place:'Mumbai',role:'Fashion Designer at Tisser',photo:'f_alumni1.jpg'},
    {name:'Tejashree Dalvi',batch:'Batch 2020-21',place:'Mumbai',role:'Founded Her Own Brand — TEJAVASTRA',photo:'f_alumni2.jpg'},
    {name:'Ruchita Bandal',batch:'Batch 2018-19',place:'Mumbai',role:'Shreeji Exim Pvt Ltd',photo:'f_alumni3.png'},
    {name:'Anisha Shedge',batch:'Batch 2021-22',place:'Mumbai',role:'Aanchal Apparel',photo:'f_alumni4.png'},
    {name:'Rutika Phanse',batch:'Batch 2021-22',place:'Mumbai',role:'Aanchal Apparel',photo:'f_alumni5.png'},
    {name:'Priya Chaudhary',batch:'Batch 2021-22',place:'Mumbai',role:'Freelancer, Choreographer & Designer',photo:'f_alumni6.png'},
    {name:'Ruchika Dhurat',batch:'Batch 2019-20',place:'Mumbai',role:'Assistant Creative Director',photo:'f_alumni7.png'},
    {name:'Aarti Makhija',batch:'Batch 2014-15',place:'Mumbai',role:'Store Dealing',photo:'f_alumni8.jpeg'}
  ],
  'interior-design':[
    {name:'Sakshi Chavan',batch:'Batch 2024-25',place:'Mumbai',role:'Interior Designer, Lines and Groves',photo:'idd_alumni2.jpg'},
    {name:'Shivani Shinde',batch:'Batch 2024-25',place:'Mumbai',role:'Interior Designer, Transformation Design Studio',photo:'idd_alumni1.jpg'},
    {name:'Amruta Shinde',batch:'Batch 2024-25',place:'Mumbai',role:'Interior Designer, One World Center',photo:'idd_alumni3.jpg'},
    {name:'Vaishali Solanki',batch:'Batch 2024-25',place:'Mumbai',role:'Interior Designer, One World Center',photo:'idd_alumni4.jpg'}
  ],
  'beauty-culture':[
    {name:'Shruti Jadhav',batch:'Batch 2021-23',place:'Mumbai',role:'Beautician, Lakme Salon',photo:'ab2.jpg'},
    {name:'Sangeeta Bala',batch:'Batch 2020-22',place:'Mumbai',role:'Nail Artist, The Bombay Nail Company',photo:'ab1.jpg'},
    {name:'Meenakshi Jaiswal',batch:'Batch 2019-21',place:'Mumbai',role:'Urban Company',photo:'ab3.png'},
    {name:'Bindu Vishwakarma',batch:'Batch 2022-24',place:'Pune',role:'YesMadam',photo:'ab4.png'},
    {name:'Chanchal Nagar',batch:'Batch 2022-24',place:'Pune',role:'Skin Savvy',photo:'beautyd1.jpeg'}
  ]
};

const facultyData={
  'applied-arts':[
    {name:'Mrs Nalini Parab',qual:'MFA, G.D. Arts Diploma, Art Master',role:'Head of Department',photo:'art_faculty1.jpg'},
    {name:'Mrs. Kiran Gungiri',qual:'Bachelor of Computer Application',role:'Faculty',photo:'art_faculty2.jpg'},
    {name:'Mr. Sharavan Kamble',qual:'G.D. Art Diploma, ATD, DVAC',role:'Lecturer',photo:'art_faculty4.jpg'},
    {name:'Ms. Afreen Kurunkop',qual:'B.Ed, B.Com, M.Com',role:'Advt Theory Lecturer',photo:'a_faculty4.jpeg'},
    {name:'Ms. Vikeshi Chaudhary',qual:'B.Ed, B.Com, M.Com',role:'Advt Theory Lecturer',photo:'a_faculty5.jpeg'},

    {name:'Mrs. Priya Shah',qual:'Level 1 DPP in Computer, B.Sc, M.A., B.Ed',role:'Lab Instructor',photo:'art_faculty3.jpg'}
  ],
  'fashion-design':[
    {name:'Mrs. Pallavi Patekar',qual:'BSc. Home Science, Diploma in Textile Design, Diploma in traditional Textile designing from Ministry of Textile',role:'Head of Department',photo:'f_faculty1.jpg'},
    {name:'Mrs. Kavita Ghosalkar',qual:'Diploma in Fashion Designing & Merchandising',role:'Faculty for Illustration',photo:'f_faculty3.jpeg'},
    {name:'Mrs. Jaishika Ratanpal',qual:'Masters in Apparel & Fashion Designing',role:'Faculty for Merchandising',photo:'f_faculty2.jpg'},
    {name:'Ms. Priya Shah',qual:'B.Sc., M.A., B.Ed.',role:'Communication Lecturer',photo:'art_faculty3.jpg'},
    {name:'Ms. Amita Chheda',qual:'B.Sc., M.A., B.Ed.',role:'Language Lab Lecturer',photo:'b_faculty4.jpg'},
    {name:'Mrs. Kiran Gungiri',qual:'Bachelor of Computer Application',role:'Faculty for Computer',photo:'art_faculty2.jpg'},
    {name:'Mr Ajit Shah',qual:'BCom, LLB',role:'Faculty',photo:'f_faculty4.jpeg'}
  ],
  'interior-design':[
    {name:'Ar. Mustafa A. Bengali',qual:'G.D. Arch., A.I.I.A., A.I.I.D.',role:'Head of Department',photo:'idd_faculty1.jpg'},
    {name:'Mrs. Sushama R. Thakkar',qual:'M.H.Sc., F.R.M., D.I.D.D.',role:'Senior Lecturer',photo:'idd_faculty5.jpeg'},
    {name:'Mr. Sunil Mestry',qual:'MID, Bcom, GDIDD',role:'Visiting Lecturer',photo:'idd_faculty4.jpeg'},
    {name:'Ms. Milina Pereira',qual:'B.A, M.A, M.Phil English literature',role:'Visiting Lecturer',photo:'idd_faculty3.jpeg'},
    {name:'Ms. Namrata Supugade',qual:'Govt. Interior Designing and Decoration',role:'Regular Faculty',photo:'idd_faculty2.jpeg'},
    {name:'Mrs. Bhumika Godbole',qual:'Govt. Interior Designing and Decoration',role:'Visiting Lecturer & Freelance Interior Designer',photo:'idd_faculty8.jpeg'},
    {name:'Ms. Madhura Deshpande',qual:'BA, GDIDD(govt)',role:'Visiting Lecturer',photo:'idd_faculty7.jpeg'},
    {name:'Mr. Sahil Talib',qual:'B-Com, GDIDD',role:'Visiting Lecturer',photo:'idd_faculty6.jpeg'},
    {name:'Ms. Preeti Soman',qual:'Masters in Interior Designing',role:'Visiting Lecturer',photo:'idd_faculty9.jpeg'}
  ],
  'beauty-culture':[
    {name:'Mrs. Rehana Bepari',qual:'B.A., Diploma Beauty Culture & Hair Dressing',role:'Head of Department',photo:'b_faculty1.jpg'},
    {name:'Ms. Priya Shah',qual:'B.Sc., M.A., B.Ed.',role:'Senior Lecturer',photo:'art_faculty3.jpg'},
    {name:'Ms. Amita Chheda',qual:'B.Sc., M.A., B.Ed.',role:'Senior Lecturer',photo:'b_faculty4.jpg'},
    {name:'Ms. Anita Gupta',qual:'B.B.A., MSBTE Diploma',role:'Lecturer',photo:'b_faculty3.jpg'},
    {name:'Ms. Priyanka Kadulkar',qual:'HSC, MSBTE Diploma in Beauty Culture',role:'Lecturer',photo:'b_faculty2.jpg'},
    {name:'Mrs. Geeta Bhalla',qual:'Cosmetology & Nail Art Specialist',role:'Visiting Faculty',photo:'geetabhalla.jpeg'},
    {name:'Ms. Priyanka Sable',qual:'Cosmetology Expert, Industry Certified',role:'Visiting Faculty',photo:'sable.jpeg'}
  ]
};

const deptHeroImages={
  'applied-arts':[{url:'art2.jpeg'},{url:'art3.jpeg'},{url:'aa2.png'},{url:'art5.jpg'}],
  'fashion-design':[{url:'fashion_hero1.jpeg'},{url:'f4.png'},{url:'f1.png'},{url:'f3.png'},{url:'f_hero1.png'},{url:'f_hero2.'}],
  'interior-design':[{url:'idd_hero1.jpeg'},{url:'iddhero5.jpeg'},{url:'idd_sub1.jpg'},{url:'idd_sub2.png'}],
  'beauty-culture':[{url:'bd2.jpg'},{url:'b2.jpg'},{url:'makeup.jpeg'},{url:'bd3.jpg'}]
};
const deptHlImages={
  'applied-arts':[{url:'art_sub3.jpg',cap:'Creative Work'},{url:'art_sub1.jpg',cap:'Industrial Visit'},{url:'art_sub2.jpg',cap:'Exhibitions'}],
  'fashion-design':[{url:'f11.jpg',cap:'Industry Visit'},{url:'f12.jpg',cap:'Fashion Studio'},{url:'f13.jpg',cap:'Annual Exhibition'}],
  'interior-design':[{url:'idd_sub1.jpg',cap:'Interior Studio'},{url:'iddhero1.png',cap:'Space Planning'},{url:'idd_sub3.jpg',cap:'CAD Labs'}],
  'beauty-culture':[{url:'b11.jpeg',cap:'Hairstyle'},{url:'b12.jpeg',cap:'Laser Skincare Training'},{url:'b13.jpeg',cap:'Hair Treatment'},{url:'b14.jpg',cap:'Makeup Studio'}]
};
const deptConfig={
  'applied-arts':{icon:'fas fa-paint-brush',tag:'Creative Expression & Visual Communication',stats:[{v:'3 Yrs',l:'Diploma'},{v:'1 Yr',l:'Certificate'},{v:'1984',l:'Est.'}]},
  'fashion-design':{icon:'fas fa-tshirt',tag:'Where Creativity Meets the Fashion Industry',stats:[{v:'1 Yr',l:'Duration'},{v:'9+',l:'Subjects'},{v:'100%',l:'Practical'}]},
  'interior-design':{icon:'fas fa-couch',tag:'Designing Spaces That Inspire',stats:[{v:'3 Yrs',l:'Diploma'},{v:'CAD',l:'Labs'},{v:'1989',l:'Est.'}]},
  'beauty-culture':{icon:'fas fa-spa',tag:'Learn the Art of Beauty with Hands-on Training',stats:[{v:'8 Wk',l:'Salon Training'},{v:'100%',l:'Hands-On'},{v:'6+',l:'Specialists'}]}
};
const deptNames={'applied-arts':'Applied Art','fashion-design':'Fashion Designing','interior-design':'Interior Designing','beauty-culture':'Beauty Culture'};

const CD={
  'applied-arts':{title:'Applied Art',sub:'3-Year Diploma & 1-Year Certificate Course',
    hl:['Professional training aligned with advertising agency requirements','Computer-oriented syllabus throughout course','Specialised modules in Typography, Illustration & Photography','Live demos by practicing artists and industry professionals','Portfolio development and annual exhibition showcase','Advertising campaign projects with real brand briefs'],
    desc:'This course creates awareness about opportunities for students in Fine Art and Visual Communications. Students learn to develop creative concepts and execute them professionally.',
    ua:['Professional training for advertising agencies','Computer-oriented syllabus','Specialised: Typography, Illustration & Photography','Demos by practicing artists'],
    jo:['Executive post in advertising agency','Executive in Company art departments','Start own advertising agency','Freelance artist','Illustrator'],
    courses:[{t:'3 YEARS DIPLOMA COURSE (FULL TIME)',d:['Medium: English','Time: 1.30 to 6.00 pm (Mon–Fri)','Eligibility: S.S.C., H.S.C.']},{t:'1 YEAR CERTIFICATE COURSE (PART TIME)',d:['Medium: English','Time: 1.30–6.00 pm (Any 3 days)','Eligibility: H.S.C. or equivalent + Aptitude Test']}],
    car:['Advertising Agency Executive','Graphic Designer','Art Director','Illustrator','Animation','Branding','UI/UX Designer','Packaging Designer','Typography Specialist']},
  'fashion-design':{title:'Fashion & Textile Designing',sub:'Integrated Course in Fashion & Textile Designing',
    hl:['Practical based learning approach throughout','Fully equipped Stitching labs with Industrial sewing machines','Fashion Show every alternate year — real runway experience','Well-known Fashion Industry Personalities as guest lecturers','Includes Accessory making as an additional specialized skill','2 months internship after completing the course'],
    det:['Medium: English','Timing: 1.00 p.m. to 6.00 p.m.','Eligibility: 10th/12th','Duration: 1 Year'],
    obj:'To make students able to work in the fashion and textile industry.',
    subj:['Garment Construction','Fashion Illustration','Introduction to Textile','Accessory Making','Embroidery / Indian Embroidery','Computer Skills','Communication Skills','Introduction to Merchandising','Costumes of India/World','Basics of Textile'],
    fp:['Freelancing with designers','Small business in textiles and accessory making','Studio or boutique ownership','Sales in stores or merchandising','Export house opportunities'],
    car:['Fashion Industry','Boutiques','Fashion Designer','Accessories Designer','Stylist','Entrepreneur']},
  'interior-design':{title:'Interior Design & Decoration',sub:'Year of Establishment: 1989 to date',
    hl:['MSBTE Government approved syllabus & Certificates / Diploma','State-of-the-art training Labs with CAD facilities','Study Tours for hands-on site experience','Workshops by Expert Architects and Interior Designers'],
    courses:[{t:'Government Recognised Diploma Course',d:['Duration: 3 Years Part Time Daily','Hours: 1.30 p.m. to 5.30 p.m.','Admissions: As per DTE Maharashtra norms','Eligibility: S.S.C. Pass']},{t:"Institute's Certificate Course",d:['Duration: First + Second Year Part Time','Hours: 1.30 p.m. to 5.30 p.m.','Eligibility: S.S.C. Pass']}],
    elig:['Passed SSC with Mathematics from Maharashtra State Board or equivalent','Out-of-state candidates must obtain Eligibility Certificate from MSBTE'],
    subj:{'First Year':['Perspective Drawing','Theory of Material','Design','Construction'],'Second Year':['Design','Working Drawing','Services','Professional Practice']},
    acts:['Seminars: Case studies and Market Surveys','Guest Lectures by Architects and Interior Designers','Study Tours','Exhibition of Students work'],
    car:['Interior Designer','Space Planner','Design Consultant','CAD Specialist','Freelance Designer','Exhibition Designer']},
  'beauty-culture':{title:'Diploma in Beauty Culture & Hair Dressing',sub:'Professional Beauty Therapy Program — MSBTE Diploma',
    hl:['MSBTE Government approved syllabus & Diploma Certificates','8-week Salon Training Program with real client experience','100% Practical Hands-On Training throughout','Guaranteed Internship & Placement Support','Expert-Led Training by certified industry professionals','Workshops & Seminars on latest beauty trends','Hands-on training on advanced skin machines like Hydra Facial, High Frequency, Galvanic, RF, Skin Lifting, Microdermabrasion Ultrasonic, etc'],
    overview:'Our institute offers a well-structured Diploma in Beauty Culture and Hair Dressing (Affiliated to Maharashtra State Board Of Technical Education) that focuses on both skill development and career growth. With expert guidance, practical exposure, and industry-relevant training, students are prepared for employment, entrepreneurship, and further education opportunities. From Beginner to Professional – We Guide You',
    courseDetails:[
      {t:'A) Government Diploma Course',d:['Duration: 2 Years (Full-Time) — 4 Semesters','Timings: 9:30 a.m. – 4:30 p.m.','Affiliation: MSBTE','Eligibility: SSC Pass']},
      {t:'B) Institute Certificate Course',d:['Duration: 1 Year (Part-Time)','Timings: 10:00 a.m. – 3:00 p.m.','Eligibility: Open for all']}
    ],
    objectives:['Provide comprehensive knowledge and practical skills in beauty culture','Prepare students for professional careers in salons, clinics, and beauty industry','Develop creativity, technical expertise, and client-handling skills','Promote entrepreneurship and self-employment opportunities'],
    fp:['Careers in high-profile salons and beauty studios','Freelance makeup artist (bridal, fashion, media, stage)','Entrepreneurship – start your own salon or institute','Teaching roles in beauty institutes'],
    car:['Professional Beautician','Hair Stylist','Makeup Artist (Bridal, Editorial, Film & TV)','Nail Technician / Nail Artist','Salon Manager','Skin Therapist / Skin Aesthetician','Freelance Artist','Aroma Therapist','Professional Trainer / Entrepreneur','Cosmetologist']}
};

const syllabusImages={
  'beauty-culture':[{label:'Semester I',src:'bsem1.png'},{label:'Semester II',src:'bsem2.png'},{label:'Semester III',src:'bsem3.png'},{label:'Semester IV',src:'bsem4.png'}],
  'interior-design':[{label:'Semester I',src:'iddsem1.jpg'},{label:'Semester II',src:'iddsem2.jpg'},{label:'Semester III',src:'iddsem3.jpg'},{label:'Semester IV',src:'iddsem4.jpg'},{label:'Semester V',src:'iddsem5.jpg'},{label:'Semester VI',src:'iddsem6.jpg'}]
};

const appliedArtSemData=[
  {label:'1st Year — 1st Semester',subjects:[{code:'01',name:'Theory (Fundamental of Art)'},{code:'02',name:'Study from Life'},{code:'03',name:'Product Illustration'},{code:'04',name:'2D Design'},{code:'05',name:'3D Design'},{code:'06',name:'Computer'},{code:'17',name:'Class Work'}]},
  {label:'1st Year — 2nd Semester',subjects:[{code:'02',name:'Study from Life'},{code:'08',name:'Theory (Advertising Art & Idea)'},{code:'07',name:'Book Jacket'},{code:'09',name:'Label Design'},{code:'15',name:'Typography'},{code:'16',name:'Calligraphy'},{code:'17',name:'Class Work'}]},
  {label:'2nd Year — 3rd Semester',subjects:[{code:'02',name:'Study from Life'},{code:'08',name:'Theory (Advertising Art)'},{code:'10',name:'Poster Design'},{code:'11',name:'Press Layout Design'},{code:'12',name:'Illustration'},{code:'13',name:'Packaging Design'},{code:'17',name:'Class Work'}]},
  {label:'2nd Year — 4th Semester',subjects:[{code:'02',name:'Study from Life'},{code:'08',name:'Theory (Advertising Art)'},{code:'10',name:'Poster Design'},{code:'11',name:'Press Layout'},{code:'12',name:'Illustration'},{code:'13',name:'Packaging Design'},{code:'17',name:'Class Work'}]},
  {label:'3rd Year — 5th Semester',subjects:[{code:'02',name:'Study from Life'},{code:'08',name:'Theory (Advertising Art)'},{code:'10',name:'Poster Design'},{code:'11',name:'Press Layout Design'},{code:'12',name:'Illustration'},{code:'13',name:'Packaging Design'},{code:'17',name:'Class Work'}]},
  {label:'3rd Year — 6th Semester',subjects:[{code:'02',name:'Study from Life'},{code:'08',name:'Theory (Advertising Art)'},{code:'10',name:'Poster Design'},{code:'11',name:'Press Layout Design'},{code:'12',name:'Illustration'},{code:'14',name:'Thesis (Dissertation)'},{code:'17',name:'Class Work'}]}
];

/* ══════════════════════════════════════════════
   SHORT TERM
══════════════════════════════════════════════ */
function filterSTC(deptFilter,tabEl){
  if(tabEl){document.querySelectorAll('.stc-dept-tab').forEach(t=>t.classList.remove('active'));tabEl.classList.add('active');}
  const list=deptFilter?stcCourses.filter(c=>c.dept===deptFilter):stcCourses;
  const g=document.getElementById('stcGrid');
  g.innerHTML=list.map(c=>`<div class="stc-card"><div class="stc-card-img"><img src="${c.img}" alt="${c.title}" loading="lazy" onerror="this.style.background='#f0f4ff';this.style.height='160px'"><div class="stc-card-dept-badge" style="background:${c.deptColor}cc">${c.dept}</div></div><div class="stc-card-body"><div class="stc-card-title">${c.title}</div><div class="stc-card-meta"><div class="stc-meta-item"><i class="fas fa-clock"></i> ${c.duration}</div><div class="stc-meta-item"><i class="fas fa-star"></i> ${c.credits}</div><div class="stc-meta-item"><i class="fas fa-graduation-cap"></i> ${c.eligibility}</div></div><div class="stc-syllabus"><div class="stc-syllabus-title">Syllabus Highlights</div><ul>${c.syllabus.slice(0,4).map(s=>`<li><i class="fas fa-circle"></i>${s}</li>`).join('')}</ul></div><div class="stc-fee-row"><div><div class="stc-fee">${c.fee}</div><div class="stc-fee-label">Course Fee${c.feeNote?' · '+c.feeNote:''}</div></div><div style="text-align:right;color:rgba(255,255,255,.8);font-size:.78rem;">${c.timing}</div></div><a class="stc-enroll-btn" href="${c.link || 'https://forms.gle/c2jpq3ANDt4br7u57'}" target="_blank" style="text-decoration:none;display:block;text-align:center;"><i class="fas fa-paper-plane"></i> Enquire / Enroll</a></div></div>`).join('');
}
function openSTCPage(deptFilter){
  filterSTC(deptFilter,null);
  if(deptFilter){document.querySelectorAll('.stc-dept-tab').forEach(t=>{if(t.textContent.trim().replace(/\s+/g,' ').includes(deptFilter))t.classList.add('active');else t.classList.remove('active');});}
  else{document.querySelectorAll('.stc-dept-tab').forEach((t,i)=>t.classList.toggle('active',i===0));}
  document.getElementById('stcPage').classList.add('open');document.body.style.overflow='hidden';
  clearInterval(stcHeroInterval);let si=0;
  const slides=document.querySelectorAll('#stcHeroSlides .page-hero-slide');
  stcHeroInterval=setInterval(()=>{slides.forEach(s=>s.classList.remove('active'));si=(si+1)%slides.length;slides[si].classList.add('active');},4000);
}
function closeSTCPage(){clearInterval(stcHeroInterval);document.getElementById('stcPage').classList.remove('open');document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   EVENTS
══════════════════════════════════════════════ */
function renderEventsGrid(deptKey){
  const g=document.getElementById('eventsGrid');let evList=[];
  if(!deptKey||deptKey==='all'){Object.values(eventsData).forEach(d=>{d.events.forEach(ev=>evList.push({...ev,color:d.color,deptName:d.name}));});}
  else{const d=eventsData[deptKey];if(d)evList=d.events.map(ev=>({...ev,color:d.color,deptName:d.name}));}
  if(!evList.length){g.innerHTML='<div class="no-events"><i class="fas fa-calendar-times"></i><p>No events found.</p></div>';return;}
  g.innerHTML=evList.map(ev=>`<div class="event-card"><div class="event-card-img"><img src="${ev.img}" alt="${ev.title}" loading="lazy" onerror="this.style.background='#f0f4ff'"></div><div class="event-card-body"><div class="event-card-date"><i class="fas fa-calendar"></i> ${ev.date||''}</div><h4>${ev.title}</h4><p>${ev.desc}</p></div><div class="event-card-footer"><span class="loc"><i class="fas fa-map-marker-alt"></i> ${ev.loc}</span><span class="time-badge" style="background:${ev.color}22;color:${ev.color}">${ev.time||''}</span></div></div>`).join('');
}
function showAllEvents(el){document.querySelectorAll('.ep-sidebar-item').forEach(i=>i.classList.remove('active'));if(el)el.classList.add('active');document.getElementById('epSectionTitle').innerHTML=`<i class="fas fa-calendar-alt" style="color:var(--cyan)"></i> All Upcoming Events`;renderEventsGrid('all');}
function showDeptEvents(k,el){document.querySelectorAll('.ep-sidebar-item').forEach(i=>i.classList.remove('active'));if(el)el.classList.add('active');const d=eventsData[k];if(!d)return;document.getElementById('epSectionTitle').innerHTML=`<span style="display:inline-flex;align-items:center;gap:8px;"><span style="background:${d.color};color:#fff;padding:3px 12px;border-radius:20px;font-size:.8rem;">${d.name}</span> Events</span>`;renderEventsGrid(k);}
function openEventsPage(deptFilter){
  document.getElementById('eventsPage').classList.add('open');document.body.style.overflow='hidden';
  if(deptFilter){const items=document.querySelectorAll('.ep-sidebar-item');items.forEach(i=>i.classList.remove('active'));const map={'applied-arts':1,'fashion-design':2,'interior-design':3,'beauty-culture':4};const idx=map[deptFilter];if(items[idx])items[idx].classList.add('active');showDeptEvents(deptFilter,null);}
  else{const all=document.querySelector('.ep-sidebar-item');if(all)all.classList.add('active');showAllEvents(null);}
}
function closeEventsPage(){document.getElementById('eventsPage').classList.remove('open');document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   NOTICES
══════════════════════════════════════════════ */
function showNotices(key,el){
  document.querySelectorAll('.np-sidebar-item').forEach(i=>i.classList.remove('active'));if(el)el.classList.add('active');
  const titles={all:'All Notices','applied-arts':'Applied Art Notices','fashion-design':'Fashion Design Notices','interior-design':'Interior Design Notices','beauty-culture':'Beauty Culture Notices','general':'General / Admin Notices'};
  document.getElementById('npSectionTitle').innerHTML=`<i class="fas fa-bell"></i> ${titles[key]||'Notices'}`;
  const notices=noticesData[key]||[];
  if(!notices.length){document.getElementById('noticesList').innerHTML='<div style="text-align:center;padding:40px;color:#9ca3af;"><i class="fas fa-bell-slash" style="font-size:2rem;display:block;margin-bottom:12px;"></i>No notices for this department.</div>';return;}
  document.getElementById('noticesList').innerHTML=notices.map(n=>`<div class="notice-card ${n.type}"><div class="notice-date-block"><div class="nd">${n.day}</div><div class="nm">${n.month}</div></div><div class="notice-content"><h4>${n.title}</h4><p>${n.desc}</p><span class="notice-tag ${n.type}"><i class="fas fa-tag"></i> ${n.type.charAt(0).toUpperCase()+n.type.slice(1)}</span></div></div>`).join('');
}
function openNoticesPage(deptFilter){
  document.getElementById('noticesPage').classList.add('open');document.body.style.overflow='hidden';
  if(deptFilter){const items=document.querySelectorAll('.np-sidebar-item');items.forEach(i=>i.classList.remove('active'));const map={'applied-arts':1,'fashion-design':2,'interior-design':3,'beauty-culture':4,'general':5};const idx=map[deptFilter];if(items[idx])items[idx].classList.add('active');showNotices(deptFilter,null);}
  else{const all=document.querySelector('.np-sidebar-item');if(all)all.classList.add('active');showNotices('all',null);}
}
function closeNoticesPage(){document.getElementById('noticesPage').classList.remove('open');document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   FACILITY
══════════════════════════════════════════════ */
const facilityData={
 
  gym:{title:'Gym & Sports Facilities',    solidColor:'#dc2626',backgroundPosition:'center',icon:'fas fa-dumbbell',img:'sportsturf.png',bannerDesc:'A fully equipped gymnasium for the physical well-being of our students.',cards:[{icon:'fas fa-dumbbell',iconBg:'#fef2f2',iconColor:'#dc2626',title:'Fully Equipped Gym',desc:'Modern gym equipment including treadmills, free weights, resistance machines, and cardio stations.'},{icon:'fas fa-running',iconBg:'#fff7ed',iconColor:'#f97316',title:'Cardio Zone',desc:'Dedicated cardio area with cycling machines for endurance and cardiovascular fitness.'},{icon:'fas fa-trophy',iconBg:'#f0fdf4',iconColor:'#10b981',title:'Sports Activities',desc:'Organized sports events, annual sports day, and inter-department competitions.'},{icon:'fas fa-user-shield',iconBg:'#eff6ff',iconColor:'#3b82f6',title:'Certified Trainer',desc:'Qualified fitness instructor available to guide students on proper exercise techniques.'}],features:['Treadmills & Elliptical Trainers','Free Weights & Dumbbells','Resistance & Cable Machines','Annual Sports Day','Inter-Department Tournaments','Locker & Change Room','First Aid & Safety Equipment'],hours:{time:'9:00 AM – 4:00 PM',days:'Monday to Saturday',note:'Closed on Sundays and public holidays. Students must carry their ID card.'}},
  counselling:{title:'Counselling Centre',solidColor:'#8b5cf6',icon:'fas fa-heart',img:'counsellor.png', backgroundPosition:'center',bannerDesc:'A safe, confidential space for academic, personal, and emotional challenges.',cards:[{icon:'fas fa-comments',iconBg:'#f5f3ff',iconColor:'#8b5cf6',title:'One-on-One Sessions',desc:'Private counselling sessions with certified professionals.'},{icon:'fas fa-users',iconBg:'#eff6ff',iconColor:'#3b82f6',title:'Group Workshops',desc:'Regular group sessions on stress management and mental wellness.'},{icon:'fas fa-graduation-cap',iconBg:'#f0fdf4',iconColor:'#10b981',title:'Academic Guidance',desc:'Help with academic planning, study strategies, and career exploration.'},{icon:'fas fa-phone-alt',iconBg:'#fff7ed',iconColor:'#f97316',title:'Crisis Support',desc:'Immediate support for students facing urgent mental health concerns.'}],features:['Certified Professional Counsellors','100% Confidential Sessions','Career Counselling','Stress & Anxiety Management','Academic Difficulty Support','Peer Support Groups','Mental Health Awareness Programs','Online Appointment Booking'],hours:{time:'10:00 AM – 5:00 PM',days:'Monday to Friday',note:'Walk-in and prior appointment both accepted. All sessions are completely confidential.'}},
  library:{title:'Library',solidColor:'#1e3a8a',icon:'fas fa-book',img:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1100&q=80',bannerDesc:'A well-stocked library offering books, journals, and periodicals.',cards:[{icon:'fas fa-book-open',iconBg:'#eff6ff',iconColor:'#1e3a8a',title:'Extensive Collection',desc:'Books, journals, and periodicals covering Applied Art, Fashion, Interior Design, Beauty Culture.'},{icon:'fas fa-wifi',iconBg:'#f0fdf4',iconColor:'#10b981',title:'Wi-Fi & Internet Corner',desc:'Fully Wi-Fi enabled with 5 computers for internet access.'},{icon:'fas fa-desktop',iconBg:'#fff7ed',iconColor:'#f97316',title:'OPAC — 24×7 Online Access',desc:'The full library collection is searchable online around the clock.'},{icon:'fas fa-users',iconBg:'#f5f3ff',iconColor:'#8b5cf6',title:'Open Membership',desc:'Open to members of constituent colleges of Seva Mandal Education Society.'}],features:['Books, Journals & Periodicals','Library OPAC — 24×7 Online Access','Wi-Fi Enabled Throughout','5 Internet Access Computers','Open Membership','Reference Services','Closed Sundays & Public Holidays'],hours:{time:'Weekdays: 9:30 AM – 5:00 PM',days:'Saturdays: 9:30 AM – 3:30 PM',note:'Closed on Sundays and Public Holidays.'}},
  'student-support':{title:'Student Support Services',solidColor:'#10b981',icon:'fas fa-hands-helping',img:'iddhero5.jpeg',bannerDesc:'Comprehensive support services designed to help every student thrive.',cards:[{icon:'fas fa-rupee-sign',iconBg:'#f0fdf4',iconColor:'#10b981',title:'Scholarships & Freeship',desc:'Guidance for government scholarships, minority scholarships, freeship applications.'},{icon:'fas fa-briefcase',iconBg:'#eff6ff',iconColor:'#1e3a8a',title:'Placement Cell',desc:'Active placement cell connecting students with salons, design studios, fashion houses.'},{icon:'fas fa-chalkboard-teacher',iconBg:'#fff7ed',iconColor:'#f97316',title:'Extra Coaching',desc:'Remedial classes for students who need additional support.'},{icon:'fas fa-certificate',iconBg:'#f5f3ff',iconColor:'#8b5cf6',title:'Certificate Assistance',desc:'Help with issuing bonafide certificates and other official documents.'}],features:['Government Scholarship Guidance','Merit Scholarships','Campus Placements','Alumni Network Access','Soft Skills Training','Grievance Redressal Cell','Anti-Ragging Committee',"Women's Cell Support",'Fee Installment Facility'],hours:{time:'9:30 AM – 5:30 PM',days:'Monday to Saturday',note:'Contact the student support desk directly or email info@sscnipolytechnic.edu.'}},
infrastructure: {
  title: 'Infrastructure & Campus',
  solidColor: '#f97316',
  icon: 'fas fa-city',
  img: 'hero1.jpeg',
  bannerDesc: 'Modern, purpose-built infrastructure designed to inspire creativity.',
  cards: [
    {icon:'fas fa-paint-brush',iconBg:'#fff7ed',iconColor:'#f97316',title:'Dedicated Studios',desc:'Specialised studios for Applied Art, Fashion, Interior Design, and Beauty Culture.'},
    {icon:'fas fa-laptop',iconBg:'#eff6ff',iconColor:'#3b82f6',title:'Computer & CAD Labs',desc:'Fully equipped computer labs with design software for all departments.'},
    {icon:'fas fa-flask',iconBg:'#f0fdf4',iconColor:'#10b981',title:'Practical Labs',desc:'Dedicated beauty labs, stitching labs, and material labs for hands-on training.'},
    {icon:'fas fa-chalkboard',iconBg:'#f5f3ff',iconColor:'#8b5cf6',title:'Seminar Hall',desc:'Spacious seminar hall for guest lectures, workshops and events.'}
  ],
  features:[
    'Dedicated Applied Art Studio','Fashion Design & Stitching Lab','Interior Design Studio with CAD Lab',
    'Beauty Culture Practice Lab','Computer Lab with Design Software',
    'Common Room & Student Lounge','Notice Board & Digital Displays','CCTV Security Coverage','Accessible Campus Design'
  ],
  gallery:[
    {src:'hero1.jpeg',cap:'Campus Building'},{src:'designcell.png',cap:'Interior Design Studio'},
    {src:'ravji-hall.jpg',cap:'Hall'},{src:'reading_room.jpg',cap:'Gandhian Center'},
    {src:'beauty_culture_lab.jpg',cap:'Beauty Culture Lab'},{src:'counsellor_room.jpg',cap:'Counsellor Room'},
    {src:'clothing_lab.jpg',cap:'Clothing Lab'},{src:'display_units.jpg',cap:'Display Unit'},
    {src:'smart_classroom_new.jpg',cap:'Smart Classroom'},{src:'textile_loom.jpg',cap:'Textile Room'},
    {src:'extitile_testing.jpg',cap:'Textile Testing Lab'},{src:'fabric_manufacture_laboratory.jpg',cap:'Fabric Painting Lab'},
    {src:'wet_processing_lab.jpg',cap:'Wet Processing Lab'},{src:'apparel_design_lab.jpg',cap:'Apparel Lab'},
    {src:'makeup.jpeg',cap:'Beauty Culture Salon'},{src:'f3.png',cap:'Fashion Design Studio'},
    {src:'common.jpeg',cap:'Ground Floor'},{src:'model.png',cap:'Exhibition & Model Display'},
    {src:'sportsturf.png',cap:'Sports & Open Area'},{src:'audi.jpg',cap:'Auditorium & Hall'},
    {src:'administrative.jpg',cap:'Administrative Section'}
  ],
  hours:{time:'8:30 AM – 5:00 PM',days:'Monday to Saturday',note:'Campus access requires valid student or staff ID.'}
}}

function openFacilityPage(key){
  const f=facilityData[key];if(!f)return;
  
  // Set background image
  document.getElementById('fpHeroBg').style.backgroundImage=`url('${f.img}')`;
document.getElementById('fpHeroBg').style.backgroundPosition = f.backgroundPosition || 'center center';  document.getElementById('fpHeroBg').style.backgroundSize='cover';
  
  // *** FIX: Update the title to show facility-specific title ***
  document.getElementById('fpTitle').textContent=f.title;  // This was missing!
  document.getElementById('fpSubtitle').textContent=f.bannerDesc;
  
  document.getElementById('fpHeroTag').innerHTML=`<i class="${f.icon}"></i> &nbsp;${f.title}`;
  document.getElementById('fpHeroIcon').innerHTML=`<i class="${f.icon}"></i>`;

  const cardsHTML=f.cards.map(c=>`<div class="fp-card" style="border-left:5px solid ${c.iconColor}"><div class="fp-card-icon" style="background:${c.iconBg};color:${c.iconColor}"><i class="${c.icon}"></i></div><h3>${c.title}</h3><p>${c.desc}</p></div>`).join('');
  const featuresHTML=f.features.length?`<div class="fp-features"><h3 style="border-bottom-color:var(--blue)"><i class="${f.icon}" style="color:var(--blue)"></i> What We Offer</h3><ul>${f.features.map(ft=>`<li style="background:rgba(0,0,0,.03)"><i class="fas fa-check-circle" style="color:#10b981"></i> ${ft}</li>`).join('')}</ul></div>`:'';
  const galleryHTML=f.gallery?`<div style="background:#fff;border-radius:14px;padding:28px 30px;box-shadow:0 4px 18px rgba(0,0,0,.08);margin-bottom:32px;"><h3 style="font-size:1.3rem;font-weight:800;color:var(--blue);margin-bottom:18px;padding-bottom:11px;border-bottom:3px solid var(--orange);display:flex;align-items:center;gap:10px;"><i class="fas fa-images" style="color:var(--orange)"></i> Our Campus in Pictures</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;">${f.gallery.map((g,idx)=>`<div onclick="openGalleryLb(${JSON.stringify(f.gallery.map(x=>x.src))},${idx})" style="cursor:pointer;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.1);border:1px solid #e5e7eb;transition:transform .25s,box-shadow .25s;" onmouseover="this.style.transform='translateY(-5px)';this.style.boxShadow='0 10px 24px rgba(0,0,0,.16)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 14px rgba(0,0,0,.1)'"><div style="overflow:hidden;height:290px;"><img src="${g.src}" alt="${g.cap}" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s;" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform=''" onerror="this.parentElement.style.background='#f0f4ff';this.style.display='none'"></div><div style="padding:10px 14px;background:#fff;"><div style="font-size:.85rem;font-weight:700;color:var(--blue);">${g.cap}</div></div></div>`).join('')}</div></div>`:'';
  document.getElementById('fpBody').innerHTML=`<div class="fp-cards">${cardsHTML}</div>${featuresHTML}${galleryHTML}<div class="fp-hours" style="background:${f.solidColor}"><div class="fp-hours-info"><h3><i class="fas fa-clock" style="margin-right:8px;"></i>Hours & Availability</h3><p>${f.hours.days}</p><p style="margin-top:6px;font-size:.88rem;opacity:.8;">${f.hours.note}</p></div><div class="fp-hours-badge"><div class="time">${f.hours.time}</div><div class="label">Operating Hours</div></div></div>`;
  document.getElementById('facilityPage').classList.add('open');document.body.style.overflow='hidden';
}
function closeFacilityPage(){document.getElementById('facilityPage').classList.remove('open');document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   CTX NAV
══════════════════════════════════════════════ */
function buildCtxLinks(deptKey){
  const hasGallery=!!deptGallery[deptKey];
  const base=[
    {id:'ctxEnquiry',icon:'fas fa-phone-alt',label:'Enquiry',onclick:`ctxOpenEnquiry('${deptKey}')`},
    {id:'ctxWhyUs',icon:'fas fa-star',label:'Why Choose Us',onclick:`ctxScroll('coWhyUsSection')`},
    {id:'ctxAlumni',icon:'fas fa-user-graduate',label:'Alumni',onclick:`ctxScroll('coAlumniSection')`},
    ...(deptKey==='beauty-culture'?[{id:'ctxTestimonials',icon:'fas fa-star',label:'Testimonials',onclick:`ctxScroll('coTestimonialSection')`}]:[]),
    {id:'ctxAdmission',icon:'fas fa-calendar-check',label:'Admission Open',onclick:`showAdm('${CD[deptKey]?.title||deptKey}')`},
    {id:'ctxEvents',icon:'fas fa-calendar',label:'Events',onclick:`ctxOpenDeptEvents()`},
    {id:'ctxNotices',icon:'fas fa-bell',label:'Notices',onclick:`ctxOpenDeptNotices()`}
  ];
  if(hasGallery) base.splice(3,0,{id:'ctxGallery',icon:'fas fa-images',label:'Gallery',onclick:`ctxScroll('coGallerySection')`});
  return base.map((l,i)=>`<div class="ctx-link${i===0?' active':''}" id="${l.id}" onclick="${l.onclick}"><i class="${l.icon}"></i> ${l.label}</div>`).join('');
}
function ctxScroll(sectionId){
  const el=document.getElementById(sectionId);
  if(el){const coPage=document.getElementById('coPage');coPage.scrollTo({top:el.offsetTop-100,behavior:'smooth'});}
  document.querySelectorAll('.ctx-link').forEach(l=>l.classList.remove('active'));
  event&&event.currentTarget&&event.currentTarget.classList.add('active');
}
function ctxOpenEnquiry(deptKey){const enq=deptEnquiry[deptKey]||{};window.location.href=`tel:${enq.phone}`;}
function ctxOpenDeptEvents(){if(currentDept){closeAllPages();openEventsPage(currentDept);}}
function ctxOpenDeptNotices(){if(currentDept){closeAllPages();openNoticesPage(currentDept);}}

/* ══════════════════════════════════════════════
   CO HERO SLIDER
══════════════════════════════════════════════ */
function startCoHeroSlider(deptKey){
  clearInterval(coHeroSlideInterval);
  const imgs=deptHeroImages[deptKey]||[];coHeroIdx=0;
  if(imgs.length<2)return;
  coHeroSlideInterval=setInterval(()=>{
    coHeroIdx=(coHeroIdx+1)%imgs.length;
    const slides=document.querySelectorAll('#coHeroSlides .co-hero-slide');
    const dots=document.querySelectorAll('#coHeroDots .co-hdot');
    slides.forEach(s=>s.classList.remove('active'));dots.forEach(d=>d.classList.remove('active'));
    if(slides[coHeroIdx])slides[coHeroIdx].classList.add('active');
    if(dots[coHeroIdx])dots[coHeroIdx].classList.add('active');
  },4000);
  
}

/* ══════════════════════════════════════════════
   HL IMAGE SLIDER
══════════════════════════════════════════════ */
function hlImgGo(idx){
  const imgs=window._curHlImgs||[];if(!imgs.length)return;
  document.querySelectorAll('#hlImgSlider .hl-img-slide').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#hlImgSlider .hl-img-dot').forEach(d=>d.classList.remove('active'));
  const slides=document.querySelectorAll('#hlImgSlider .hl-img-slide');
  const dots=document.querySelectorAll('#hlImgSlider .hl-img-dot');
  if(slides[idx])slides[idx].classList.add('active');if(dots[idx])dots[idx].classList.add('active');
  const cap=document.getElementById('hlImgCap');if(cap&&imgs[idx])cap.textContent=imgs[idx].cap||'';
  coHlIdx=idx;
}
function startHlSlider(deptKey){
  clearInterval(coHlSlideInterval);const imgs=deptHlImages[deptKey]||[];window._curHlImgs=imgs;coHlIdx=0;
  if(imgs.length<2)return;
  coHlSlideInterval=setInterval(()=>{coHlIdx=(coHlIdx+1)%imgs.length;hlImgGo(coHlIdx);},3500);
}
function buildHlSection(deptKey,hlArr){
  const imgs=deptHlImages[deptKey]||[];
  const slides=imgs.map((img,i)=>`<div class="hl-img-slide${i===0?' active':''}" style="background-image:url('${img.url}')"></div>`).join('');
  const dots=imgs.map((_,i)=>`<div class="hl-img-dot${i===0?' active':''}" onclick="hlImgGo(${i})"></div>`).join('');
  const sliderHtml=imgs.length?`<div class="hl-img-slider" id="hlImgSlider">${slides}<div class="hl-img-dots">${dots}</div><div class="hl-img-caption" id="hlImgCap">${imgs[0]?.cap||''}</div></div>`:'';
  return`<div class="hl-with-img"><div class="hl-list-wrap"><div class="c-hl"><ul>${hlArr.map(i=>`<li><i class="fas fa-check"></i> ${i}</li>`).join('')}</ul></div></div>${sliderHtml}</div>`;
}

/* ══════════════════════════════════════════════
   BUILD ALUMNI SLIDER HTML + START SCROLL
══════════════════════════════════════════════ */
function buildAlumniSlider(deptKey){
  const alums=alumniData[deptKey]||[];if(!alums.length)return'';
  // 3 copies for seamless looping
  const allA=[...alums,...alums,...alums];
  const cards=allA.map(a=>`<div class="alumni-rect-card"><img class="alumni-big-photo" src="${a.photo}" alt="${a.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><div class="alumni-placeholder-big" style="display:none"><i class="fas fa-user"></i></div><div class="alumni-info-block"><div class="alumni-info-name">${a.name}</div><div class="alumni-info-batch"><i class="fas fa-map-marker-alt"></i>${a.place||'Mumbai'} · <i class="fas fa-calendar-alt"></i>${a.batch}</div><div class="alumni-info-role"><i class="fas fa-briefcase"></i>${a.role}</div></div></div>`).join('');
  return`<div class="alumni-infinite-wrap" id="alumniWrap_${deptKey}"><div class="alumni-infinite-fade-l"></div><div class="alumni-infinite-fade-r"></div><div class="alumni-infinite-track-outer"><div class="alumni-infinite-track" id="alumniTrack_${deptKey}">${cards}</div></div></div>`;
}
function startInfiniteAlumni(deptKey){
  const ctrl = createInfiniteScroll(`alumniTrack_${deptKey}`, `alumniWrap_${deptKey}`, alumniData[deptKey].length, 244, 0.5);
  if(ctrl) scrollControllers[`alumni_${deptKey}`] = ctrl;
}

/* ══════════════════════════════════════════════
   BUILD FACULTY SLIDER HTML + START SCROLL  ← FIXED
   (was mstartInfiniteFaculty, now correctly named startInfiniteFaculty)
══════════════════════════════════════════════ */
function buildFacultySlider(deptKey){
  const facs=facultyData[deptKey]||[];if(!facs.length)return'';
  const copies=[...facs,...facs,...facs,...facs];
  const cards=copies.map(f=>`<div class="faculty-rect-card"><div class="faculty-big-photo-wrap"><img class="faculty-big-photo" src="${f.photo}" alt="${f.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><div class="faculty-placeholder-big" style="display:none"><i class="fas fa-chalkboard-teacher"></i></div><div class="faculty-role-badge">${f.role}</div></div><div class="faculty-info-block"><div class="faculty-info-name">${f.name}</div><div class="faculty-info-qual" style="flex-direction:column;gap:3px;">${f.qual.split(',').map(q=>`<div style="display:flex;align-items:flex-start;gap:5px;"><i class="fas fa-dot-circle" style="color:var(--purple);margin-top:3px;flex-shrink:0;font-size:.65rem;"></i><span style="font-size:.75rem;color:#555;">${q.trim()}</span></div>`).join('')}</div></div></div>`).join('');
  return`<div class="faculty-infinite-wrap" id="facultyWrap_${deptKey}"><div class="faculty-infinite-fade-l"></div><div class="faculty-infinite-fade-r"></div><div class="faculty-infinite-track-outer"><div class="faculty-infinite-track" id="facultyTrack_${deptKey}">${cards}</div></div></div>`;
}
/* ← THE BUG WAS HERE: previously named mstartInfiniteFaculty, never called */
function startInfiniteFaculty(deptKey){
  const ctrl = createInfiniteScroll(`facultyTrack_${deptKey}`, `facultyWrap_${deptKey}`, facultyData[deptKey].length, 244, 0.45);
  if(ctrl) scrollControllers[`faculty_${deptKey}`] = ctrl;
}

/* ══════════════════════════════════════════════
   GALLERY (BEAUTY CULTURE)
══════════════════════════════════════════════ */
function buildGallerySection(deptKey){
  const imgs=deptGallery[deptKey];if(!imgs||!imgs.length)return'';
  const srcs=imgs.map(i=>i.src);
  const allImgs=[...imgs,...imgs,...imgs];
  const items=allImgs.map((img,i)=>`<div class="gal-inf-card" onclick="openGalleryLb(${JSON.stringify(srcs)},${i%imgs.length})"><img src="${img.src}" alt="${img.cap}" loading="lazy" onerror="this.parentElement.style.background='#f0f4ff'"><div class="gal-inf-cap">${img.cap}</div></div>`).join('');
  return`<div id="coGallerySection" class="ci"><h3><i class="fas fa-images"></i> Gallery</h3><div class="gal-inf-wrap" id="galWrap_${deptKey}"><div class="gal-inf-fade-l"></div><div class="gal-inf-fade-r"></div><div class="gal-inf-track-outer"><div class="gal-inf-track" id="galTrack_${deptKey}">${items}</div></div></div></div>`;
}
function startInfiniteGallery(deptKey){
  const ctrl = createInfiniteScroll(`galTrack_${deptKey}`, `galWrap_${deptKey}`, deptGallery[deptKey].length, 240, 0.6);
  if(ctrl) scrollControllers
  if(ctrl) scrollControllers[`gallery_${deptKey}`] = ctrl;
}

/* ══════════════════════════════════════════════
   TESTIMONIALS (BEAUTY CULTURE ONLY)
══════════════════════════════════════════════ */
function buildTestimonials(){
  const data=[
    {quote:'This program combines academic excellence with industry exposure, ensuring students gain both technical expertise and real-world experience, making them fully prepared for a successful career in the beauty and wellness industry.',name:'Ms. Chaitali Yewale',role:'Makeup Artist & Studio Owner'},
    {quote:'I am Chaitali Yewale, Makeup Artist and owner of Chaitali Yewale Makeup Artist Studio. The training and practical experience helped me gain confidence and start my own studio successfully. I am thankful for the guidance that shaped my career.',name:'Ms. Chaitali Yewale',role:'Makeup Artist & Studio Owner'},
    {quote:'Joining this course was a turning point in my life. The supportive teachers, practical sessions, and real salon exposure helped me gain confidence and skills. Today, I feel proud of my journey and sincerely thank the institute for its continuous support.',name:'Ms. Shraddha Potdar',role:'Batch 2018–2019'},
    {quote:'The Diploma in Beauty Culture and Hair Dressing gave me industry-relevant skills and hands-on training, which made me job-ready. The institute\'s guidance and practical exposure played a key role in my placement, and I highly recommend this course to aspiring beauty professionals.',name:'Ms. Shruti Jadhav',role:'Placed at Lakmé Salon, Vashi · Batch 2023–2024'},
    {quote:'The course provided excellent practical training and boosted my confidence to work professionally. I am thankful to the institute for its guidance and support.',name:'Ms. Sangeeta Bala',role:'Nail Technician, The Bombay Nail Company · Batch 2023–2024'},
    {quote:'Joining this course was one of the best decisions for my career. The practical training and continuous support helped me gain confidence and skills. Today, I feel proud to be working independently, and I sincerely thank the institute for this opportunity.',name:'Ms. Meenakshi Jaiswal',role:'Working with Urban Company'}
  ];
  const cards=data.map(t=>`<div class="testi-card"><div class="testi-quote-icon"><i class="fas fa-quote-left"></i></div><p class="testi-text">${t.quote}</p><div class="testi-author"><div class="testi-avatar">${t.name.replace('Ms. ','').replace('Mrs. ','').trim()[0]}</div><div><div class="testi-name">${t.name}</div><div class="testi-role">${t.role}</div></div></div></div>`).join('');
  return`<div id="coTestimonialSection" class="ci"><h3><i class="fas fa-star"></i> Testimonials</h3><div class="testi-grid">${cards}</div></div>`;
}

/* ══════════════════════════════════════════════
   ENQUIRY + ADMISSION BANNER
══════════════════════════════════════════════ */
function buildEnquirySection(deptKey){
  const enq=deptEnquiry[deptKey]||{};
  const igBtn=enq.instagram?`<a href="${enq.instagram}" target="_blank" style="display:inline-flex;align-items:center;gap:7px;background:#e1306c;color:#fff;padding:9px 16px;border-radius:8px;font-weight:700;font-size:.82rem;text-decoration:none;"><i class="fab fa-instagram"></i> Instagram</a>`:'';
  const fbBtn=enq.facebook?`<a href="${enq.facebook}" target="_blank" style="display:inline-flex;align-items:center;gap:7px;background:#1877f2;color:#fff;padding:9px 16px;border-radius:8px;font-weight:700;font-size:.82rem;text-decoration:none;"><i class="fab fa-facebook-f"></i> Facebook</a>`:'';
  return`<div id="coEnquirySection" class="enquiry-section">
    <div class="eq-info">
      <p>Have questions? Reach us directly.<br>📞 ${enq.phone} &nbsp;·&nbsp; ✉️ ${enq.email||'info@sscnipolytechnic.edu'}</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      ${igBtn}${fbBtn}
    </div>
  </div>`;
}
function buildAdmissionBanner(deptKey){
  const enq=deptEnquiry[deptKey]||{};
  return`<div class="admission-banner">
    <div class="ab-icon"><i class="fas fa-graduation-cap"></i></div>
    <div class="ab-info">
      <h3>🎯 Admissions Open 2026–27</h3>
      <p>${enq.batchInfo||'New batch starting June 2026'}. Limited seats available — apply early to secure your spot!</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
      <div class="ab-badge">
        <span style="font-size:1.1rem;font-weight:800;">Now Open</span>
        <span class="badge-label">2026–27 Admissions</span>
      </div>
      <a href="${enq.applyLink||'https://forms.gle/DeheEBLa6WcdFKb58'}" target="_blank" class="apply-btn" style="margin-top:0;padding:9px 22px;font-size:.9rem;text-decoration:none;"><i class="fas fa-paper-plane"></i> Apply Now</a>
    </div>
  </div>`;
}
/* ══════════════════════════════════════════════
   PLANNER CARD
══════════════════════════════════════════════ */
function buildPlannerCard(deptKey){
  const p=deptPlanners[deptKey];if(!p)return'';
  const eventsHtml=p.events.map(e=>`<li class="planner-event-item"><div class="planner-event-date"><div class="pd">${e.day}</div><div class="pm">${e.month}</div></div><div class="planner-event-info"><h5>${e.title}</h5><p>${e.desc}</p></div></li>`).join('');
  return`<div id="coPlannerSection" class="planner-card"><div class="planner-card-hdr"><h3><i class="fas fa-calendar-check"></i> Academic Planner — ${deptNames[deptKey]||'Department'}</h3><span class="planner-month-badge"><i class="fas fa-user-tie"></i> HOD: ${p.hod}</span></div><div style="font-size:.8rem;opacity:.75;margin-bottom:12px;">${p.month}</div><ul class="planner-events-list">${eventsHtml}</ul><a class="planner-dl-btn" href="${p.pdfFile}" download="f_planner25-26.pdf"><i class="fas fa-download"></i> Download Academic Calendar (PDF)</a></div>`;
}

/* ══════════════════════════════════════════════
   DEPT SHORT-TERM MINI STRIP
══════════════════════════════════════════════ */
function buildDeptSTCStrip(deptKey){
  const deptMap={'applied-arts':'Applied Art','fashion-design':'Fashion Design','interior-design':'Interior Design','beauty-culture':'Beauty Culture'};
  const deptName=deptMap[deptKey];
  const courses=stcCourses.filter(c=>c.dept===deptName);
  if(!courses.length)return'';
  const cards=courses.map(c=>`<div class="dept-stc-mini" onclick="openSTCPage('${deptName}')"><img src="${c.img}" alt="${c.title}" onerror="this.style.background='#f0f4ff'"><div class="dept-stc-mini-body"><h5>${c.title}</h5><p>${c.duration} · ${c.fee}</p><div class="dept-stc-goto"><i class="fas fa-external-link-alt"></i> View in Short Term Courses</div></div></div>`).join('');
  return`<div class="dept-stc-strip"><h3><i class="fas fa-certificate"></i> Short Term Courses — ${deptName}</h3><div class="dept-stc-cards">${cards}</div></div>`;
}

/* ══════════════════════════════════════════════
   DEPT NOTICE & EVENT STRIP
══════════════════════════════════════════════ */
function buildDeptNEStrip(deptKey){
  const notices=(noticesData[deptKey]||[]).slice(0,4);
  const events=(eventsData[deptKey]?.events||[]).slice(0,4);
  const noticesHtml=notices.length?notices.map(n=>`<li class="ne-item"><div class="ne-item-dot" style="background:${n.type==='urgent'?'#dc2626':n.type==='event'?'#f97316':'#3b82f6'}"></div><div class="ne-item-txt">${n.title}<span class="ne-date">${n.day} ${n.month}</span></div></li>`).join(''):'<li class="ne-item"><div class="ne-item-txt" style="color:#9ca3af">No recent notices.</div></li>';
  const eventsHtml=events.length?events.map(e=>`<li class="ne-item"><div class="ne-item-dot" style="background:${eventsData[deptKey]?.color||'#8b5cf6'}"></div><div class="ne-item-txt">${e.title}<span class="ne-date">${e.date||''} · ${e.loc}</span></div></li>`).join(''):'<li class="ne-item"><div class="ne-item-txt" style="color:#9ca3af">No upcoming events.</div></li>';
  return`<div class="dept-ne-strip"><div class="ne-card"><div class="ne-card-hdr"><h4><i class="fas fa-bell"></i> Latest Notices</h4><span class="view-all" onclick="openNoticesPage('${deptKey}')">View All →</span></div><ul class="ne-list">${noticesHtml}</ul></div><div class="ne-card"><div class="ne-card-hdr"><h4><i class="fas fa-calendar-alt"></i> Upcoming Events</h4><span class="view-all" onclick="openEventsPage('${deptKey}')">View All →</span></div><ul class="ne-list">${eventsHtml}</ul></div></div>`;
}

/* ══════════════════════════════════════════════
   SYLLABUS BUILDERS
══════════════════════════════════════════════ */
function buildSyllabusImgs(deptKey){
  const imgs=syllabusImages[deptKey]||[];if(!imgs.length)return'';
  const cols=imgs.map(s=>`<div class="syllabus-img-card"><div class="sem-label"><i class="fas fa-file-alt"></i> ${s.label}</div><img src="${s.src}" alt="${s.label}" loading="lazy" onclick="openLightbox('${s.src}')"></div>`).join('');
  return`<div class="syllabus-img-grid">${cols}</div>`;
}
function buildAppliedArtSyllabus(){
  let html='';
  for(let i=0;i<appliedArtSemData.length;i+=3){
    const group=appliedArtSemData.slice(i,i+3);
    const cols=group.map(sem=>`<div style="flex:1;min-width:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.08);border:1px solid #e0e7ff;"><div style="background:var(--blue);color:#fff;padding:10px 16px;font-size:.85rem;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-calendar-alt"></i> ${sem.label}</div><table style="width:100%;border-collapse:collapse;font-size:.83rem;"><thead><tr style="background:#f0f4ff;"><th style="padding:7px 12px;text-align:left;color:var(--blue);font-weight:700;border-bottom:1px solid #e0e7ff;width:52px;">Code</th><th style="padding:7px 12px;text-align:left;color:var(--blue);font-weight:700;border-bottom:1px solid #e0e7ff;">Subject</th></tr></thead><tbody>${sem.subjects.map((s,idx)=>`<tr style="background:${idx%2===0?'#fff':'#f8faff'};"><td style="padding:7px 12px;color:var(--red);font-weight:700;border-bottom:1px solid #f3f4f6;font-size:.82rem;">${s.code}</td><td style="padding:7px 12px;color:#374151;border-bottom:1px solid #f3f4f6;">${s.name}</td></tr>`).join('')}</tbody></table></div>`).join('');
    html+=`<div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">${cols}</div>`;
  }
  return html;
}
function buildInteriorSyllabusImages(){
  const imgs=syllabusImages['interior-design']||[];let html='';
  for(let i=0;i<imgs.length;i+=3){
    const group=imgs.slice(i,i+3);
    const cols=group.map(s=>`<div style="flex:1;min-width:200px;border-radius:10px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.12);background:#f8faff;border:1px solid #e0e7ff;"><div style="background:#f97316;color:#fff;padding:8px 16px;font-size:.85rem;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-file-alt"></i> ${s.label}</div><img src="${s.src}" alt="${s.label}" loading="lazy" onclick="openLightbox('${s.src}')" style="width:100%;height:auto;display:block;cursor:zoom-in;"></div>`).join('');
    html+=`<div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">${cols}</div>`;
  }
  return html;
}

/* ══════════════════════════════════════════════
   COURSE OVERVIEW CONTENT BUILDER
══════════════════════════════════════════════ */
function buildCO(t){
  const c=CD[t];
  const neStrip=buildDeptNEStrip(t);
  const planner=buildPlannerCard(t);
  const stcStrip=buildDeptSTCStrip(t);
  const enquiry=buildEnquirySection(t);
  const admBanner=buildAdmissionBanner(t);
  const gallery=buildGallerySection(t);
  const whyChooseUs=`<div id="coWhyUsSection" class="ci"><h3><i class="fas fa-star"></i> Why Choose Us</h3>${buildHlSection(t,c.hl)}</div>`;
  const alumniSection=`<div id="coAlumniSection" class="ci"><h3><i class="fas fa-user-graduate"></i> Alumni Snapshots</h3>${buildAlumniSlider(t)}</div>`;

  if(t==='applied-arts') return`${enquiry}${admBanner}${neStrip}${planner}${whyChooseUs}<div class="ci"><h3><i class="fas fa-info-circle"></i> Course Overview</h3><div class="c-dt"><p>${c.desc}</p></div></div><div class="ci"><h3><i class="fas fa-bullseye"></i> Course Objectives</h3><div class="c-hl"><ul>${c.ua.map(i=>`<li><i class="fas fa-check-circle"></i> ${i}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-book"></i> Courses Offered</h3>${c.courses.map(x=>`<div class="c-dt"><h4>${x.t}</h4><ul>${x.d.map(d=>`<li>${d}</li>`).join('')}</ul></div>`).join('')}</div><div class="ci"><h3><i class="fas fa-list-alt"></i> 6 Semester Syllabus</h3>${buildAppliedArtSyllabus()}</div><div class="ci"><h3><i class="fas fa-briefcase"></i> Career Opportunities</h3><div class="c-car"><ul>${c.car.map(o=>`<li><i class="fas fa-arrow-right"></i> ${o}</li>`).join('')}</ul></div></div>${alumniSection}<div class="ci"><h3><i class="fas fa-chalkboard-teacher"></i> Our Faculty</h3>${buildFacultySlider(t)}</div>${stcStrip}<div style="text-align:center;margin-top:22px"><a href="${deptEnquiry[t]?.applyLink||'https://forms.gle/DeheEBLa6WcdFKb58'}" target="_blank" class="apply-btn" style="text-decoration:none;"><i class="fas fa-clipboard-check"></i> APPLY FOR ADMISSION</a></div>`;

  if(t==='fashion-design') return`${enquiry}${admBanner}${neStrip}${planner}${whyChooseUs}<div class="ci"><h3><i class="fas fa-info-circle"></i> Course Overview</h3><div class="c-dt"><ul>${c.det.map(d=>`<li>${d}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-bullseye"></i> Course Objectives</h3><div class="c-dt"><p>${c.obj}</p></div></div><div class="ci"><h3><i class="fas fa-list-alt"></i> Subjects Offered</h3><div class="c-sub"><ul>${c.subj.map(s=>`<li><i class="fas fa-bookmark"></i> ${s}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-briefcase"></i> Career Opportunities</h3><div class="c-car"><ul>${c.car.map(o=>`<li><i class="fas fa-arrow-right"></i> ${o}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-chart-line"></i> Future Prospects</h3><div class="c-hl"><ul>${c.fp.map(i=>`<li><i class="fas fa-check-circle"></i> ${i}</li>`).join('')}</ul></div></div>${alumniSection}<div class="ci"><h3><i class="fas fa-chalkboard-teacher"></i> Our Faculty</h3>${buildFacultySlider(t)}</div>${stcStrip}<div style="text-align:center;margin-top:22px"><button class="apply-btn" onclick="showAdm('${c.title}')"><i class="fas fa-clipboard-check"></i> APPLY FOR ADMISSION</button></div>`;

  if(t==='interior-design') return`${enquiry}${admBanner}${neStrip}${whyChooseUs}<div class="ci"><h3><i class="fas fa-info-circle"></i> Course Overview</h3>${c.courses.map(x=>`<div class="c-dt"><h4>${x.t}</h4><ul>${x.d.map(d=>`<li>${d}</li>`).join('')}</ul></div>`).join('')}</div><div class="ci"><h3><i class="fas fa-bullseye"></i> Eligibility</h3><div class="c-dt"><ul>${c.elig.map(i=>`<li>${i}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-list-alt"></i> Subjects Offered for Certificate Course</h3>${Object.entries(c.subj).map(([y,s])=>`<div class="c-sub"><h4>${y}</h4><ul>${s.map(sub=>`<li><i class="fas fa-bookmark"></i> ${sub}</li>`).join('')}</ul></div>`).join('')}</div><div class="ci"><h3><i class="fas fa-book"></i> Govt. Diploma Course — 6 Semesters</h3>${buildInteriorSyllabusImages()}</div><div class="ci"><h3><i class="fas fa-calendar-alt"></i> Activities</h3><div class="c-hl"><ul>${c.acts.map(i=>`<li><i class="fas fa-check-circle"></i> ${i}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-briefcase"></i> Career Opportunities</h3><div class="c-car"><ul>${c.car.map(o=>`<li><i class="fas fa-arrow-right"></i> ${o}</li>`).join('')}</ul></div></div>${alumniSection}<div class="ci"><h3><i class="fas fa-chalkboard-teacher"></i> Our Faculty</h3>${buildFacultySlider(t)}</div>${stcStrip}<div style="text-align:center;margin-top:22px"><button class="apply-btn" onclick="showAdm('${c.title}')"><i class="fas fa-clipboard-check"></i> APPLY FOR ADMISSION</button></div>`;

  if(t==='beauty-culture') return`${enquiry}${admBanner}${neStrip}${whyChooseUs}<div class="ci"><h3><i class="fas fa-info-circle"></i> Course Overview</h3><div class="c-dt"><p>${c.overview}</p></div>${c.courseDetails.map(x=>`<div class="c-dt"><h4>${x.t}</h4><ul>${x.d.map(d=>`<li>${d}</li>`).join('')}</ul></div>`).join('')}</div><div class="ci"><h3><i class="fas fa-bullseye"></i> Course Objectives</h3><div class="c-hl"><ul>${c.objectives.map(i=>`<li><i class="fas fa-check-circle"></i> ${i}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-book"></i> MSBTE Syllabus — 2023-24</h3>${buildSyllabusImgs(t)}</div><div class="ci"><h3><i class="fas fa-briefcase"></i> Career Opportunities</h3><div class="c-car"><ul>${c.car.map(o=>`<li><i class="fas fa-arrow-right"></i> ${o}</li>`).join('')}</ul></div></div><div class="ci"><h3><i class="fas fa-chart-line"></i> Future Prospects</h3><div class="c-hl"><ul>${c.fp.map(i=>`<li><i class="fas fa-check-circle"></i> ${i}</li>`).join('')}</ul></div></div>${alumniSection}${buildTestimonials()}<div class="ci"><h3><i class="fas fa-chalkboard-teacher"></i> Our Faculty</h3>${buildFacultySlider(t)}</div>${stcStrip}${gallery}<div style="text-align:center;margin-top:22px"><button class="apply-btn" onclick="showAdm('${c.title}')"><i class="fas fa-clipboard-check"></i> APPLY FOR ADMISSION</button></div>`;
  return'';
}

/* ══════════════════════════════════════════════
   SHOW COURSE OVERVIEW
══════════════════════════════════════════════ */
function showCO(t){
  const c=CD[t];if(!c)return;
  currentDept=t;
  // stop any existing scroll controllers
  Object.values(scrollControllers).forEach(ctrl=>ctrl&&ctrl.stop&&ctrl.stop());
  const cfg=deptConfig[t];
  const imgs=deptHeroImages[t]||[];
  document.getElementById('coHeroSlides').innerHTML=imgs.map((img,i)=>`<div class="co-hero-slide${i===0?' active':''}" style="background-image:url('${img.url}')"></div>`).join('');

  if(t==='interior-design'){
  const iddSlides = document.querySelectorAll('#coHeroSlides .co-hero-slide');
  if(iddSlides[1]) iddSlides[1].style.backgroundPosition = 'center';
  if(iddSlides[2]) iddSlides[2].style.backgroundPosition = 'center';
}


if(t==='interior-design'){
  const iddSlides=document.querySelectorAll('#coHeroSlides .co-hero-slide');
  if(iddSlides[1]) iddSlides[1].style.backgroundPosition='center';
  if(iddSlides[2]) iddSlides[2].style.backgroundPosition='center';
}

if(t==='beauty-culture'){
  const bcSlides=document.querySelectorAll('#coHeroSlides .co-hero-slide');
  if(bcSlides[0]) bcSlides[0].style.backgroundPosition='center';
  if(bcSlides[1]) bcSlides[1].style.backgroundPosition='center';
  if(bcSlides[3]) bcSlides[3].style.backgroundPosition='center';
}


if(t==='fashion-design'){
  const fdSlides=document.querySelectorAll('#coHeroSlides .co-hero-slide');
  if(fdSlides[4]) fdSlides[4].style.backgroundPosition='center';
  if(fdSlides[5]) fdSlides[5].style.backgroundPosition='center';
}


  const dotsEl=document.getElementById('coHeroDots');
  dotsEl.innerHTML=imgs.map((_,i)=>`<div class="co-hdot${i===0?' active':''}"></div>`).join('');
  dotsEl.querySelectorAll('.co-hdot').forEach((d,i)=>d.addEventListener('click',()=>{clearInterval(coHeroSlideInterval);document.querySelectorAll('#coHeroSlides .co-hero-slide').forEach(s=>s.classList.remove('active'));document.querySelectorAll('#coHeroDots .co-hdot').forEach(dd=>dd.classList.remove('active'));document.querySelectorAll('#coHeroSlides .co-hero-slide')[i]?.classList.add('active');d.classList.add('active');coHeroIdx=i;startCoHeroSlider(t);}));
  document.getElementById('coHeroIcon').className=cfg.icon;
  document.getElementById('coHeroTitle').textContent=c.title;
  document.getElementById('coHeroTag').innerHTML=`<i class="fas fa-bookmark"></i> ${cfg.tag}`;
  document.getElementById('coHeroStats').innerHTML=cfg.stats.map(s=>`<div class="co-hero-stat"><span class="sv">${s.v}</span><span class="sl">${s.l}</span></div>`).join('');
  document.getElementById('ctxDeptName').textContent=deptNames[t]||t;
  document.getElementById('ctxLinksContainer').innerHTML=buildCtxLinks(t);
  document.getElementById('coBody').innerHTML=buildCO(t);
  const page=document.getElementById('coPage');
  page.classList.add('on');page.scrollTop=0;
  document.body.style.overflow='hidden';
  startCoHeroSlider(t);
  setTimeout(()=>{
    startHlSlider(t);
    startInfiniteAlumni(t);
    startInfiniteFaculty(t);
    if(t==='beauty-culture') startInfiniteGallery(t);
  },300);
}
function closeCO(){
  clearInterval(coHeroSlideInterval);
  clearInterval(coHlSlideInterval);
  Object.values(scrollControllers).forEach(ctrl=>ctrl&&ctrl.stop&&ctrl.stop());
  document.getElementById('coPage').classList.remove('on');
  document.body.style.overflow='';
  currentDept=null;
}

/* ══════════════════════════════════════════════
   ADMISSION
══════════════════════════════════════════════ */
function showAdm(n){document.getElementById('admTitle').textContent=`Admission — ${n}`;document.getElementById('admPage').classList.add('on');document.getElementById('admPage').scrollTop=0;document.body.style.overflow='hidden';}
function closeAdm(){document.getElementById('admPage').classList.remove('on');document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   PARENT BODY PAGE
══════════════════════════════════════════════ */
function openParentBodyPage(){document.getElementById('parentBodyPage').classList.add('open');document.body.style.overflow='hidden';}
function closeParentBodyPage(){document.getElementById('parentBodyPage').classList.remove('open');document.body.style.overflow='';}

/* ══════════════════════════════════════════════
   KEYBOARD ESC
══════════════════════════════════════════════ */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    closeCO();closeAdm();closeEventsPage();
    closeFacilityPage();closeNoticesPage();closeSTCPage();
    closeParentBodyPage();
    document.getElementById('sylLightbox').classList.remove('open');
    closeGalleryLb();
    closeAutoPopup();
    closePdfModal();
  }
});

/* ══════════════════════════════════════════════
   SCROLL OBSERVER
══════════════════════════════════════════════ */
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}});},{threshold:.1});
document.querySelectorAll('.vm-card,.dept-card,.about-img,.about-txt').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(22px)';el.style.transition='opacity .5s ease,transform .5s ease';obs.observe(el);});

function parseHashStr(hashStr) {
  const params = {};
  hashStr.replace('#','').split('&').forEach(pair => {
    const [k,v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return params;
}
function parseHash() { return parseHashStr(window.location.hash); }

function setHash(params) {
  const str = Object.entries(params)
    .filter(([,v]) => v)
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const newHash = str ? '#' + str : window.location.pathname;
  history.pushState(params, '', newHash);
}

function clearHash() {
  history.replaceState({ page:'home' }, '', window.location.pathname);
}
/* Raw refs — captured once before wrapping */
const _rawShowCO       = showCO;
const _rawOpenSTC      = openSTCPage;
const _rawOpenEvents   = openEventsPage;
const _rawOpenNotices  = openNoticesPage;
const _rawOpenFacility = openFacilityPage;
const _rawShowAdm      = showAdm;
const _rawOpenParent   = openParentBodyPage;
const _rawCloseCO      = closeCO;
const _rawCloseSTCPage = closeSTCPage;
const _rawCloseEvents  = closeEventsPage;
const _rawCloseNotices = closeNoticesPage;
const _rawCloseFacility= closeFacilityPage;
const _rawCloseParent  = closeParentBodyPage;

/* Restore page from a hash string using RAW functions (no extra pushState) */
function restoreFromHashStr(hashStr) {
  const p = parseHashStr(hashStr);
  if (!p.page || p.page === 'home') return;
  switch (p.page) {
    case 'co':
      _rawShowCO(p.dept);
      injectCOFooter(p.dept);
      break;
    case 'stc':        _rawOpenSTC(p.dept || null); break;
    case 'events':     _rawOpenEvents(p.dept || null); break;
    case 'notices':    _rawOpenNotices(p.dept || null); break;
    case 'facility':   _rawOpenFacility(p.key); break;
    case 'adm':
      _rawShowAdm(decodeURIComponent(p.name || ''));
      injectAdmFooter();
      break;
    case 'parentbody': _rawOpenParent(); break;
  }
}

/* Wrapped versions — push hash AND open */
showCO = function(t) {
  _rawShowCO(t);
  setHash({ page:'co', dept:t });
  injectCOFooter(t);
};
openSTCPage = function(d) {
  _rawOpenSTC(d);
  setHash({ page:'stc', dept: d || '' });
};
openEventsPage = function(d) {
  _rawOpenEvents(d);
  setHash({ page:'events', dept: d || '' });
};
openNoticesPage = function(d) {
  _rawOpenNotices(d);
  setHash({ page:'notices', dept: d || '' });
};
openFacilityPage = function(k) {
  _rawOpenFacility(k);
  setHash({ page:'facility', key: k });
};
showAdm = function(n) {
  _rawShowAdm(n);
  setHash({ page:'adm', name: n });
};
openParentBodyPage = function() {
  _rawOpenParent();
  setHash({ page:'parentbody' });
};

/* Close wrappers — clear hash */
closeCO = function() { _rawCloseCO(); clearHash(); };
closeSTCPage = function() { _rawCloseSTCPage(); clearHash(); };
closeEventsPage = function() { _rawCloseEvents(); clearHash(); };
closeNoticesPage = function() { _rawCloseNotices(); clearHash(); };
closeFacilityPage = function() { _rawCloseFacility(); clearHash(); };
closeParentBodyPage = function() { _rawCloseParent(); clearHash(); };

function closeAllOverlays() {
  _rawCloseCO(); _rawCloseSTCPage(); _rawCloseEvents();
  _rawCloseFacility(); _rawCloseNotices(); _rawCloseParent();
  closeAdm();
  document.body.style.overflow = '';
  window.scrollTo({ top:0, behavior:'smooth' });
}

/* Browser back/forward */
window.addEventListener('popstate', function() {
  _rawCloseCO(); _rawCloseSTCPage(); _rawCloseEvents();
  _rawCloseFacility(); _rawCloseNotices(); _rawCloseParent();
  closeAdm();
  document.getElementById('sylLightbox').classList.remove('open');
  closeGalleryLb();
  closePdfModal();
  document.body.style.overflow = '';
  restoreFromHashStr(window.location.hash);
});

/* ── Footer HTML ── */
const sharedFooterHTML = `
<footer style="background:#1e3a8a;color:#fff;padding:40px 6% 24px;position:relative;margin-top:auto;">
  <div style="position:absolute;top:0;left:0;width:100%;height:6px;background:var(--red);"></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px;max-width:1100px;margin:0 auto 28px;">
    <div>
      <h3 style="font-size:1.05rem;margin-bottom:12px;font-weight:700;">Smt. Shardaben Nanavati Institute</h3>
      <p style="color:rgba(255,255,255,.75);font-size:.88rem;line-height:1.7;margin-bottom:10px;">Empowering women through quality education since 1984.</p>
      <span style="background:var(--red);display:inline-block;padding:5px 10px;border-radius:5px;font-size:.75rem;font-weight:700;">Accredited by MSBTE</span>
    </div>
    <div>
      <h3 style="font-size:1.05rem;margin-bottom:12px;font-weight:700;padding-bottom:8px;position:relative;">Departments<span style="position:absolute;left:0;bottom:0;width:28px;height:3px;background:var(--red);display:block;"></span></h3>
      <ul style="list-style:none;">
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();showCO('applied-arts');return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Applied Art</a></li>
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();showCO('fashion-design');return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Fashion Designing</a></li>
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();showCO('interior-design');return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Interior Designing</a></li>
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();showCO('beauty-culture');return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Beauty Culture</a></li>
      </ul>
    </div>
    <div>
      <h3 style="font-size:1.05rem;margin-bottom:12px;font-weight:700;padding-bottom:8px;position:relative;">Quick Links<span style="position:absolute;left:0;bottom:0;width:28px;height:3px;background:var(--red);display:block;"></span></h3>
      <ul style="list-style:none;">
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Home</a></li>
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();openEventsPage(null);return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Events</a></li>
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();openNoticesPage(null);return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Notices</a></li>
        <li style="margin-bottom:8px;"><a href="#" onclick="closeAllOverlays();openSTCPage(null);return false;" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Short Term Courses</a></li>
        <li style="margin-bottom:8px;"><a href="https://forms.gle/DeheEBLa6WcdFKb58" target="_blank" style="color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;">Apply Now</a></li>
      </ul>
    </div>
    <div>
      <h3 style="font-size:1.05rem;margin-bottom:12px;font-weight:700;padding-bottom:8px;position:relative;">Contact Us<span style="position:absolute;left:0;bottom:0;width:28px;height:3px;background:var(--red);display:block;"></span></h3>
      <p style="color:rgba(255,255,255,.8);font-size:.88rem;margin-bottom:8px;display:flex;gap:8px;align-items:flex-start;"><i class="fas fa-map-marker-alt" style="color:var(--red);margin-top:3px;flex-shrink:0;"></i> 338, Rafi Ahmed Kidwai Rd, Matunga East, Mumbai 400019</p>
      <p style="color:rgba(255,255,255,.8);font-size:.88rem;margin-bottom:8px;display:flex;gap:8px;"><i class="fas fa-phone" style="color:var(--red);margin-top:3px;"></i> 022 24095792</p>
      <p style="color:rgba(255,255,255,.8);font-size:.88rem;margin-bottom:8px;display:flex;gap:8px;"><i class="fas fa-envelope" style="color:var(--red);margin-top:3px;"></i> smesedu@gmail.com</p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="https://www.instagram.com/scni_polytechnic?igsh=MTVpaGhud3Y1bXRrag==" target="_blank" style="background:#e1306c;color:#fff;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="fab fa-instagram"></i></a>
        <a href="https://www.facebook.com/YOUR_COLLEGE_PAGE" target="_blank" style="background:#1877f2;color:#fff;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;text-decoration:none;"><i class="fab fa-facebook-f"></i></a>
      </div>
    </div>
  </div>
  <div style="text-align:center;padding-top:20px;border-top:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:.83rem;">
    &copy; 2024 Smt. Shardaben Champaklal Nanavati Institute of Polytechnic. All Rights Reserved.
  </div>
</footer>`;

function injectCOFooter(t) {
  const coPage = document.getElementById('coPage');
  const prev = coPage.querySelector('.co-injected-footer');
  if (prev) prev.remove();
  const div = document.createElement('div');
  div.className = 'co-injected-footer';
  div.innerHTML = sharedFooterHTML;
  coPage.appendChild(div);
}
function injectAdmFooter() {
  setTimeout(() => {
    const admBody = document.querySelector('.adm-pg-body');
    if (admBody && !admBody.querySelector('footer'))
      admBody.insertAdjacentHTML('beforeend', sharedFooterHTML);
  }, 100);
}
function injectFooters() {
  ['stcPage','eventsPage','noticesPage','facilityPage','parentBodyPage'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.querySelector('footer')) el.insertAdjacentHTML('beforeend', sharedFooterHTML);
  });
}

/* ── On load — SAVE HASH FIRST before replaceState wipes it ── */
window.addEventListener('load', function () {
  const initialHash = window.location.hash;
  injectFooters();

  const p = parseHashStr(initialHash);
  const isHome = !initialHash || !p.page || p.page === 'home';

  if (!isHome) {
    // Deep-link: restore page from hash, skip popup
    history.replaceState(p, '', initialHash); // keep hash in URL
    setTimeout(() => restoreFromHashStr(initialHash), 80);
  } else {
    // Normal home load
    history.replaceState({ page:'home' }, '', window.location.pathname);
    setTimeout(() => {
      document.getElementById('autoPopup').style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }, 1000);
  }
});
  function buildAppliedArtSyllabus(){
  let html = '';
  for(let i = 0; i < appliedArtSemData.length; i += 2){
    const group = appliedArtSemData.slice(i, i + 2);
    const cols = group.map(sem => `
      <div style="background:#fff;border-radius:12px;
           overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.08);
           border:1px solid #e0e7ff;min-width:0;">
        <div style="background:var(--blue);color:#fff;
             padding:10px 16px;font-size:.85rem;font-weight:700;
             display:flex;align-items:center;gap:7px;">
          <i class="fas fa-calendar-alt"></i> ${sem.label}
        </div>
        <table style="width:100%;border-collapse:collapse;
               font-size:.83rem;table-layout:fixed;">
          <thead>
            <tr style="background:#f0f4ff;">
              <th style="padding:7px 10px;text-align:left;
                   color:var(--blue);font-weight:700;
                   border-bottom:1px solid #e0e7ff;
                   width:38px;">Code</th>
              <th style="padding:7px 10px;text-align:left;
                   color:var(--blue);font-weight:700;
                   border-bottom:1px solid #e0e7ff;">Subject</th>
            </tr>
          </thead>
          <tbody>
            ${sem.subjects.map((s, idx) => `
              <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8faff'};">
                <td style="padding:7px 10px;color:var(--red);
                     font-weight:700;border-bottom:1px solid #f3f4f6;
                     font-size:.82rem;">${s.code}</td>
                <td style="padding:7px 10px;color:#374151;
                     border-bottom:1px solid #f3f4f6;
                     word-break:break-word;">${s.name}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`).join('');

    html += `<div class="syl-row">${cols}</div>`;
  }
  return html;
}
