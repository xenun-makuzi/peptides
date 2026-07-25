const modal=document.getElementById("ageModal");


if(localStorage.getItem("verified")){

modal.style.display="none";

}


document.getElementById("enterBtn").onclick=function(){

localStorage.setItem(
"verified",
"true"
);

modal.style.display="none";

}



document.getElementById("leaveBtn").onclick=function(){

window.location.href="https://google.com";

}
const menuBtn =
document.getElementById("menuBtn");


const navMenu =
document.getElementById("navMenu");



menuBtn.onclick=function(){


navMenu.classList.toggle("active");


}
document.addEventListener(
"click",
function(event){


const clickedInsideMenu =
navMenu.contains(event.target);


const clickedButton =
menuBtn.contains(event.target);



if(!clickedInsideMenu && !clickedButton){

navMenu.classList.remove("active");

}


});

const faqs=document.querySelectorAll(".faq-item");

faqs.forEach(item=>{

const question=item.querySelector(".faq-question");

question.addEventListener("click",()=>{

faqs.forEach(faq=>{

if(faq!==item){

faq.classList.remove("active");

}

});

item.classList.toggle("active");

});

});