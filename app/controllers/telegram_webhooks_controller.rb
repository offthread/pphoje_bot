class TelegramWebhooksController < Telegram::Bot::UpdatesController
  include Telegram::Bot::UpdatesController::MessageContext
  include ApplicationHelper

  context_to_action!

  def start(*)
    # TODO: change this default message
    reply_with :message, text: 'Hi there!'
  end

  def shows(*args)
    # If arguments is not empty, check if it's a number or a string
    if args.any?
      #Day informed as a number
      if args[0].match(NUMBER_REGULAR_EXPRESSION)
        dayFromArgs = args[0].to_s.rjust(2, '0')
        errorMessage = validateDayFromMonth(dayFromArgs.to_i)
      elsif args[0].is_a? String
        #Day informed as a string (monday, tuesday...) 
        dayFromArgs = getDayFromString(args[0].to_s)
      else
        #Command does not match anything 
        errorMessage = MESSAGE_CHECK_USAGE_COMMAND
      end

      currentMonth = Date.today.strftime("%m").to_s

      if errorMessage.nil?
        @shows = Show.by_day(dayFromArgs, currentMonth)
      else
        reply_with :message, text: errorMessage
        return
      end

      dateFormated = dayFromArgs + "/" + currentMonth

      if @shows.empty?
        reply_with :message, text: "Não há shows programados para o dia " + dateFormated
      else
        response_message = "No dia " + dateFormated + ", teremos: \n"
        
        @shows.each do |show|
          response_message += "-> " + show.nome + "\n"
          response_message += "- Show confirmado: " + (show.confirmado ? "Sim" : "Não") + "\n"
          response_message += "- Informações da banda: " + show.link_artista + "\n\n"
        end
        response_message += "--------------- \n"
        reply_with :message, text: response_message
      end
    else
      reply_with :message, text: MESSAGE_CHECK_USAGE_COMMAND
    end
  end

  # v0.6
  context_handler do
    reply_with :message, text: "You wrote: #{payload['text']}"
  end

  def action_missing(action)
    reply_with :message, text: "Can not perform #{action}" if command?
  end
end
