provider "aws" {
  region = "us-east-2"
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "eks-state-s3-bucket-microstore"

  lifecycle {
    prevent_destroy = false
  }
}


resource "aws_dynamodb_table" "terraform_locks" {
  name         = "eks-state-locks-microstore"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}