let editMode=false;



const list =
document.getElementById(
"productsList"
);





const message =
document.getElementById(
"message"
);







async function uploadImage(file){


if(!file)
return null;



const filename =
Date.now()+"-"+file.name;



const {error}=await supabaseClient
.storage
.from("product-images")
.upload(
filename,
file
);



if(error){

console.log(error);

return null;

}





const {data}=supabaseClient
.storage
.from("product-images")
.getPublicUrl(
filename
);



return data.publicUrl;



}








async function loadProducts(){



const {data,error}=await supabaseClient
.from("products")
.select("*")
.order(
"created_at",
{
ascending:false
}
);





if(error){

console.log(error);

return;

}





list.innerHTML="";



data.forEach(product=>{



list.innerHTML+=`


<div class="product-admin">


<img src="${product.image_url}">



<div>


<h3>
${product.name}
</h3>


<p>
$${product.price}
</p>


<p>
${product.category}
</p>



<button 
class="edit"
onclick='editProduct(${JSON.stringify(product)})'>

Edit

</button>



<button
class="delete"
onclick="deleteProduct('${product.id}')">

Delete

</button>


</div>


</div>


`;



});



}









async function saveProduct(){



message.innerHTML="Saving...";



const id =
document.getElementById(
"productId"
).value;



let imageURL=null;

let labURL=null;





const image =
document.getElementById(
"productImage"
).files[0];



const lab =
document.getElementById(
"labImage"
).files[0];






if(image){

imageURL =
await uploadImage(image);

}


if(lab){

labURL =
await uploadImage(lab);

}







const product={



name:
name.value,


price:
Number(price.value),


category:
category.value,


description:
description.value,


featured:
featured.checked,


new_arrival:
newArrival.checked,


best_seller:
bestSeller.checked


};







if(imageURL)
product.image_url=imageURL;



if(labURL)
product.lab_test_url=labURL;







let result;



if(id){


result =
await supabaseClient
.from("products")
.update(product)
.eq("id",id);


}
else{


result =
await supabaseClient
.from("products")
.insert(product);



}





if(result.error){

console.log(result.error);

message.innerHTML="Error";


return;

}



message.innerHTML="Saved";



resetForm();


loadProducts();


}








function editProduct(product){



document.getElementById(
"productId"
).value =
product.id;



name.value =
product.name;


price.value =
product.price;


category.value =
product.category;


description.value =
product.description;


featured.checked =
product.featured;


newArrival.checked =
product.new_arrival;


bestSeller.checked =
product.best_seller;



window.scrollTo(
{
top:0,
behavior:"smooth"
}
);



}









async function deleteProduct(id){



if(!confirm(
"Delete product?"
))
return;




const {error}=await supabaseClient
.from("products")
.delete()
.eq(
"id",
id
);




if(error){

console.log(error);

return;

}



loadProducts();


}








function resetForm(){


document.querySelector(
"form"
)?.reset();



document.getElementById(
"productId"
).value="";


}







document
.getElementById("saveBtn")
.onclick =
saveProduct;



loadProducts();