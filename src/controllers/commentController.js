import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../utility/cloudinary.js";

async function createComment(req, res) {
	try {
		const { id } = req.user;
		const avatarLocalPath = req.file?.path;
		console.log("avatarLocalPath", avatarLocalPath);

		if (avatarLocalPath) {
			const cloudinaryResponse = await uploadToCloudinary(avatarLocalPath);
			const { url, public_id } = cloudinaryResponse;
			console.log("url", url);
			req.body.image = url;
			req.body.image_id = public_id;
		}

		const { description, image, image_id, postId } = req.body;

		if (!description && !image) {
			//delete image from cloudinary if it was uploaded
			if (image_id) await deleteFromCloudinary(image_id);
			return res
				.status(400)
				.json({ message: "Description or image is required" });
		}

		const newComment = new Comment({
			description,
			image,
			author: id,
			post: postId,
		});

		const savedComment = await newComment.save();

		//upon successful comment creation, update the post comment count and push the comment id to the comments array
		const post = await Post.findById(postId);
		post.comments.push(savedComment._id);
		await post.save();

		res.status(200).json(savedComment);
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
}

export { createComment };