let product;

let quantity = 1;



const id =
new URLSearchParams(
window.location.search
).get("id");





async function loadProduct(){



const {data,error}=await supabaseClient
.from("products")
.select("*")
.eq("id",id)
.single();





if(error){

console.log(error);

return;

}



product=data;



document.getElementById(
"productName"
).innerHTML =
product.name;




document.getElementById(
"productDescription"
).innerHTML =
product.description;




document.getElementById(
"productPrice"
).innerHTML =
"$"+product.price;






mainImage.src =
product.image_url;



productImageThumb.src =
product.image_url;





if(product.lab_test_url){


labImage.src =
product.lab_test_url;


labImageThumb.src =
product.lab_test_url;


}




loadRelated();

}





function changeImage(src){


mainImage.src=src;


}








plus.onclick=()=>{


quantity++;

document.getElementById(
"quantity"
).value=quantity;


}




minus.onclick=()=>{


if(quantity>1)
quantity--;


document.getElementById(
"quantity"
).value=quantity;


}







addCart.onclick=()=>{



let cart =
JSON.parse(
localStorage.getItem("cart")
)
|| [];



cart.push({

...product,

quantity:quantity

});



localStorage.setItem(
"cart",
JSON.stringify(cart)
);



alert(
"Added to cart"
);


}









async function loadRelated(){



const {data}=await supabaseClient
.from("products")
.select("*")
.neq("id",id)
.limit(3);




const box =
document.getElementById(
"relatedProducts"
);



data.forEach(item=>{


box.innerHTML+=`


<div>


<img src="${item.image_url}">


<h3>
${item.name}
</h3>


<a href="product.html?id=${item.id}">
View
</a>


</div>


`;


});



}





loadProduct();