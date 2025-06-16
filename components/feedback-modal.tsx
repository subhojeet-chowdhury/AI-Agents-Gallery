"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Star, Send } from "lucide-react"
import { submitFeedback, logUserActivity, type ChatFeedback } from "@/lib/firebase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName: string
  sessionId: string
  messageCount: number
  chatDuration: number
}

export default function FeedbackModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  sessionId,
  messageCount,
  chatDuration,
}: FeedbackModalProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const feedbackData: Omit<ChatFeedback, "id" | "timestamp"> = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        agentId,
        agentName,
        sessionId,
        rating,
        comment: comment.trim() || undefined,
        messageCount,
        chatDuration,
      }

      console.log("Submitting feedback:", feedbackData)
      const feedbackId = await submitFeedback(feedbackData)
      console.log("Feedback submitted with ID:", feedbackId)

      // Log feedback submission activity
      await logUserActivity({
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        action: "feedback_submit",
        agentId,
        sessionId,
        metadata: {
          rating,
          hasComment: !!comment.trim(),
          feedbackId,
        },
      })

      toast({
        title: "Feedback Submitted Successfully!",
        description: "Thank you for your feedback! It helps us improve our AI agents.",
      })

      // Reset form and close modal
      onClose()
      setRating(0)
      setComment("")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setRating(0)
      setComment("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your conversation with {agentName}? Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-colors"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Comments (Optional)</label>
            <Textarea
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Chat Stats */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Messages exchanged:</span>
              <span className="font-medium">{messageCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Chat duration:</span>
              <span className="font-medium">
                {chatDuration >= 60 ? `${Math.floor(chatDuration / 60)}m ${chatDuration % 60}s` : `${chatDuration}s`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Agent:</span>
              <span className="font-medium">{agentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Session ID:</span>
              <span className="font-medium text-xs">{sessionId.slice(-8)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
