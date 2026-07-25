// =====================================
// PRODUCTS PAGE
// Supabase Product Loader
// =====================================


const container =
document.getElementById("productsContainer");


let allProducts = [];




// =====================================
// LOAD PRODUCTS
// =====================================


async function getProducts(){


if(!container){

console.error(
"Products container missing"
);

return;

}



container.innerHTML =
"<p>Loading products...</p>";




const {data,error} =
await supabaseClient
.from("products")
.select("*")
.order(
"created_at",
{
ascending:false
}
);





console.log(
"Products from Supabase:",
data
);



if(error){


console.error(
"Supabase error:",
error
);


container.innerHTML =
"<p>Unable to load products</p>";


return;


}





allProducts = data || [];



renderProducts(allProducts);



}









// =====================================
// DISPLAY PRODUCTS
// =====================================


function renderProducts(products){



container.innerHTML="";



if(!products.length){


container.innerHTML =
"<p>No products available</p>";


return;


}





products.forEach(product=>{


console.log(
"Rendering product:",
product.id
);




container.innerHTML += `



<div class="product-card">



<img 
src="${product.image_url}"
alt="${product.name}"
>




<div class="product-info">



<h3>
${product.name}
</h3>




<p>

${
product.description
?
product.description.substring(0,100)
:
"Premium research product"
}

</p>




<strong>

$${product.price}

</strong>





<a href="product.html?id=${product.id}">

View Product

</a>





<button 
class="cart-btn"
data-id="${product.id}">

Add To Cart

</button>




</div>



</div>



`;



});



activateCartButtons();



}









// =====================================
// CART
// =====================================


function activateCartButtons(){



const buttons =
document.querySelectorAll(
".cart-btn"
);



buttons.forEach(button=>{


button.addEventListener(
"click",
()=>{


const id =
button.dataset.id;



addToCart(id);



});


});



}







function addToCart(id){



const product =
allProducts.find(
item =>
String(item.id)
===
String(id)
);





if(!product){


console.error(
"Product not found:",
id
);


return;


}





let cart =
JSON.parse(
localStorage.getItem("cart")
)
|| [];





const existing =
cart.find(
item =>
String(item.id)
===
String(id)
);





if(existing){


existing.quantity =
(existing.quantity || 1)+1;


}
else{


cart.push({

...product,

quantity:1

});


}






localStorage.setItem(
"cart",
JSON.stringify(cart)
);




updateCartCount();



alert(
"Added to cart"
);



}








// =====================================
// SEARCH
// =====================================


const search =
document.getElementById(
"searchInput"
);



const category =
document.getElementById(
"categoryFilter"
);







function filterProducts(){



let value =
search
?
search.value.toLowerCase()
:
"";



let cat =
category
?
category.value
:
"all";





let filtered =
allProducts.filter(product=>{


let matchName =
product.name
.toLowerCase()
.includes(value);



let matchCategory =
cat==="all" ||
product.category===cat;



return (
matchName &&
matchCategory
);



});




renderProducts(filtered);



}







if(search){

search.addEventListener(
"input",
filterProducts
);

}



if(category){

category.addEventListener(
"change",
filterProducts
);

}








// =====================================
// CART COUNT
// =====================================


function updateCartCount(){


const counter =
document.getElementById(
"cartCount"
);



if(counter){


let cart =
JSON.parse(
localStorage.getItem("cart")
)
|| [];



counter.textContent =
cart.reduce(
(sum,item)=>
sum+(item.quantity||1),
0
);


}


}







getProducts();

updateCartCount();